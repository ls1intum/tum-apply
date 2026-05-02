import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthFacadeService } from '../auth/auth-facade.service';
import { KeycloakAuthenticationService } from '../auth/keycloak-authentication.service';

/**
 * HTTP interceptor that automatically attaches the Keycloak access token (if present/logged in) to all outgoing HTTP
 * requests.
 *
 * Purpose:
 * - Ensures that every request to secured server endpoints carries a valid Bearer token in the Authorization header.
 * - Centralizes token handling so that individual services and components don't need to manage headers themselves.
 * - Catches 401 (Unauthorized) responses to trigger a global logout via the AuthFacadeService.
 *
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authFacade = inject(AuthFacadeService);
  private keycloakService = inject(KeycloakAuthenticationService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.keycloakService.getToken();
    const isRefreshRequest = request.url.includes('/api/auth/refresh');

    if (token?.length) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        // Startup probes intentionally call the refresh endpoint before we know whether a server session exists.
        // A 401 there is expected and should not trigger a competing global logout flow.
        if (err.status === 401 && !isRefreshRequest) {
          console.warn('Unauthorized – logging out');
          void this.authFacade.logout(true);
        }
        return throwError(() => err);
      }),
    );
  }
}

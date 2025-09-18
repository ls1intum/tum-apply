import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthFacadeService } from '../auth/auth-facade.service';
import { KeycloakAuthenticationService } from '../auth/keycloak-authentication.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authFacade = inject(AuthFacadeService);
  private keycloakService = inject(KeycloakAuthenticationService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.keycloakService.getToken();
    if (token !== undefined) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          console.warn('Unauthorized – logging out');
          void this.authFacade.logout();
        }
        return throwError(() => err);
      }),
    );
  }
}

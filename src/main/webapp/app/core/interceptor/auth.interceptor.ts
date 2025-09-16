import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { KeycloakService } from '../auth/keycloak.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private keycloakService = inject(KeycloakService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.shouldSkipAuth(request)) {
      return next.handle(request);
    }

    // Ensure token freshness before the request
    return from(this.keycloakService.ensureFreshToken(20)).pipe(
      switchMap(() => {
        const token = this.keycloakService.getToken();
        const authRequest = token != null ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
        return next.handle(authRequest);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // One-time retry after a forced refresh
          return from(this.keycloakService.ensureFreshToken(0)).pipe(
            switchMap(() => {
              const retryToken = this.keycloakService.getToken();
              const retryRequest = retryToken != null ? request.clone({ setHeaders: { Authorization: `Bearer ${retryToken}` } }) : request;
              return next.handle(retryRequest);
            }),
            catchError(() => throwError(() => error)),
          );
        }
        return throwError(() => error);
      }),
    );
  }

  // Determine if the request should skip authentication (e.g., preflight or Keycloak endpoints)
  private shouldSkipAuth(request: HttpRequest<unknown>): boolean {
    if (request.method === 'OPTIONS') return true;
    const url = request.url;
    return /\/realms\/[^/]+\/protocol\/openid-connect\//.test(url);
  }
}

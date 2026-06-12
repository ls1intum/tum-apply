import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthFacadeService } from '../auth/auth-facade.service';
import { KeycloakAuthenticationService } from '../auth/keycloak-authentication.service';

/**
 * Attaches the Keycloak bearer token to every outgoing request and triggers a
 * global logout on 401 responses.
 *
 * Implemented as a functional interceptor so its dependencies are resolved
 * lazily per request — this avoids a construction-time circular dependency
 * between `HttpClient` and services that transitively depend on it
 * (e.g. `KeycloakAuthenticationService` → `AuthenticationResourceApi` → `HttpClient`).
 *
 * @param request outgoing HTTP request
 * @param next next handler in the interceptor chain
 * @returns the (potentially augmented) response stream
 */
export const authInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const keycloakService = inject(KeycloakAuthenticationService);
  const authFacade = inject(AuthFacadeService);

  const token = keycloakService.getToken();
  const authedRequest =
    token !== undefined && token.length > 0 ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authedRequest).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        console.warn('Unauthorized – logging out');
        void authFacade.logout(true);
      }
      return throwError(() => err);
    }),
  );
};

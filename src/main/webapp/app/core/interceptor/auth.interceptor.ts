import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { KeycloakService } from '../auth/keycloak.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const keycloakService = this.injector.get(KeycloakService);
    const token = keycloakService.getToken();

    if (token != null) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.warn('Unauthorized - redirecting to login...');
          const router = this.injector.get(Router);
          const currentUrl = router.url;
          void router.navigate(['/login'], {
            queryParams: { redirect: currentUrl },
          });
        }
        return throwError(() => error);
      }),
    );
  }
}

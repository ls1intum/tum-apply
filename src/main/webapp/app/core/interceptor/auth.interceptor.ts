import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountService } from '../auth/account.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const keycloakService = inject(AccountService);
    const bearer = keycloakService.user()?.bearer;

    if (bearer != null) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${bearer}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.warn('Unauthorized - redirecting to login...');
          keycloakService.signIn();
        }
        return throwError(() => error);
      }),
    );
  }
}

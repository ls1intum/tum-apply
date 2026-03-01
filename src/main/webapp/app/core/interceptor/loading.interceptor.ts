import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';

import { LoadingService } from './loading.service';

/**
 * Interceptor that tracks ongoing HTTP requests and triggers the LoadingService.
 * It uses a 500ms delay to prevent screen flickering for fast requests.
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private readonly loadingService = inject(LoadingService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let triggered = false;

    // Start a timer to show the loading indicator after 500ms
    const timer = setTimeout(() => {
      triggered = true;
      this.loadingService.show();
    }, 500);

    return next.handle(request).pipe(
      finalize(() => {
        // Clear the timer if the request finishes before 500ms
        clearTimeout(timer);

        // Only hide if we actually showed it
        if (triggered) {
          this.loadingService.hide();
        }
      }),
    );
  }
}

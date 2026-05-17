import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountService } from 'app/core/auth/account.service';

/**
 * Attaches the {@code X-Active-Research-Group-Id} header to outbound API
 * requests so the server can scope research-group-aware queries to the user's
 * currently selected membership.
 *
 * The header is added only for `/api/` requests and only when the user has a
 * resolved active research group. Other requests (static assets, third-party
 * calls) are unaffected.
 */
@Injectable()
export class ActiveResearchGroupInterceptor implements HttpInterceptor {
  private readonly accountService = inject(AccountService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const activeId = this.accountService.activeResearchGroupId();
    if (activeId !== undefined && req.url.startsWith('/api/')) {
      const cloned = req.clone({
        setHeaders: { 'X-Active-Research-Group-Id': activeId },
      });
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}

import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { ApplicationConfigService } from '../config/application-config.service';

import { StateStorageService } from './state-storage.service';
import { Account } from './account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly userIdentity = signal<Account | null>(null);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly stateStorageService = inject(StateStorageService);
  private readonly applicationConfigService = inject(ApplicationConfigService);

  private accountCache$?: Observable<Account> | null;

  /**
   * Returns a readonly signal of the current user account.
   */
  trackCurrentAccount(): Signal<Account | null> {
    return this.userIdentity.asReadonly();
  }

  /**
   * Returns true if the user has at least one of the given authorities.
   */
  hasAnyAuthority(authorities: string[] | string): boolean {
    const user = this.userIdentity();
    if (!user) return false;
    const userAuthorities = user.authorities;
    const required = Array.isArray(authorities) ? authorities : [authorities];
    return required.some(role => userAuthorities.includes(role));
  }

  /**
   * Loads the current user account from the backend if not cached or forced.
   */
  identity(force?: boolean): Observable<Account> {
    if (!this.accountCache$ || force === true) {
      this.accountCache$ = this.http.get<Account>(this.applicationConfigService.getEndpointFor('api/users/me')).pipe(
        tap(account => {
          this.userIdentity.set(account);
          this.navigateToStoredUrl();
        }),
        shareReplay(1),
        catchError(err => {
          this.userIdentity.set(null);
          return throwError(() => err);
        }),
      );
    }
    return this.accountCache$;
  }

  /**
   * Returns true if the user is currently authenticated.
   */
  isAuthenticated(): boolean {
    return this.userIdentity() !== null;
  }

  /**
   * Clears the cached user state.
   */
  reset(): void {
    this.userIdentity.set(null);
    this.accountCache$ = null;
  }

  private navigateToStoredUrl(): void {
    const previousUrl = this.stateStorageService.getUrl();
    if (previousUrl) {
      this.stateStorageService.clearUrl();
      this.router.navigateByUrl(previousUrl);
    }
  }
}

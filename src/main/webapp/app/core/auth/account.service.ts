import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformServer } from '@angular/common';

import { ApplicationConfigService } from '../config/application-config.service';

import { StateStorageService } from './state-storage.service';
import { Account } from './account.model';
import { KeycloakService } from './keycloak.service';

export interface User {
  id: string;
  email: string;
  name: string;
  anonymous: boolean;
  bearer: string;
}

export const ANONYMOUS_USER: User = {
  id: '',
  email: 'nomail',
  name: 'no user',
  anonymous: true,
  bearer: '',
};

export interface SecurityState {
  loaded: boolean;
  user: User | undefined;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  #keycloakService = inject(KeycloakService);
  loaded = signal(false);
  user = signal<User | undefined>(undefined);

  loadedUser = computed(() => (this.loaded() ? this.user() : undefined));
  signedIn = computed(() => this.loaded() && !this.user()?.anonymous);
  private readonly userIdentity = signal<Account | null>(null);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly stateStorageService = inject(StateStorageService);
  private readonly applicationConfigService = inject(ApplicationConfigService);

  private accountCache$?: Observable<Account> | null;

  constructor() {
    this.onInit();
  }

  async onInit(): Promise<void> {
    const isServer = isPlatformServer(inject(PLATFORM_ID));
    const keycloakService = inject(KeycloakService);
    if (isServer) {
      this.user.set(ANONYMOUS_USER);
      this.loaded.set(true);
      return;
    }

    const isLoggedIn = await keycloakService.init();
    if (isLoggedIn && keycloakService.profile) {
      const { sub, email, given_name, family_name, token } = keycloakService.profile;
      const user = {
        id: sub,
        email,
        name: `${given_name} ${family_name}`,
        anonymous: false,
        bearer: token,
      };
      this.user.set(user);
      this.loaded.set(true);
    } else {
      this.user.set(ANONYMOUS_USER);
      this.loaded.set(true);
    }
  }

  async signIn(): Promise<void> {
    await this.#keycloakService.login();
  }

  async signOut(): Promise<void> {
    await this.#keycloakService.logout();
  }

  /**
   * Returns true if the user has at least one of the given authorities.
   */
  hasAnyAuthority(authorities: string[] | string): boolean {
    const user = this.userIdentity();
    if (!user) return false;
    const userAuthorities = user.roles;
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

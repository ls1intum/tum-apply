import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { isPlatformServer } from '@angular/common';
import { UserResourceService } from 'app/generated/api/userResource.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';

import { KeycloakService } from './keycloak.service';
import { ANONYMOUS_USER, User } from './account.model';

export interface SecurityState {
  loaded: boolean;
  user: User | undefined;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  #keycloakService = inject(KeycloakService);
  #userResourceService = inject(UserResourceService);
  loaded = signal(false);
  user = signal<User | undefined>(undefined);

  loadedUser = computed(() => (this.loaded() ? this.user() : undefined));
  signedIn = computed(() => {
    const user = this.user();
    return this.loaded() && user != null && !user.anonymous;
  });

  constructor() {
    void this.onInit();
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

      await this.fetchAuthorities();
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

  async fetchAuthorities(): Promise<void> {
    try {
      const userShortDTO = await firstValueFrom(this.#userResourceService.getCurrentUser());
      const currentUser = this.user();
      if (currentUser) {
        this.user.set({
          ...currentUser,
          authorities: userShortDTO.roles,
        });
      }
    } catch (error) {
      console.error('Failed to fetch authorities:', error);
    }
  }

  hasAnyAuthority(requiredRoles: UserShortDTO.RolesEnum[]): boolean {
    const user = this.user();
    return requiredRoles.some(role => user?.authorities?.includes(role) ?? false);
  }
}

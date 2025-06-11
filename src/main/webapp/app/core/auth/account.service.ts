import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserResourceService } from 'app/generated/api/userResource.service';

import { UserShortDTO } from '../../generated';

import { KeycloakService } from './keycloak.service';

export interface User {
  id: string;
  email: string;
  name: string;
  bearer: string;
  authorities?: string[];
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  loaded = signal<boolean>(false);
  user = signal<User | undefined>(undefined);
  loadedUser = computed(() => (this.loaded() ? this.user() : undefined));
  signedIn = computed(() => {
    const user = this.user();
    return this.loaded() && user !== undefined;
  });
  keycloakService = inject(KeycloakService);
  userResourceService = inject(UserResourceService);

  async signIn(redirectUri?: string): Promise<void> {
    await this.keycloakService.login(redirectUri);
    await this.loadUser();
  }

  async signOut(): Promise<void> {
    await this.keycloakService.logout();
  }

  hasAnyAuthority(requiredRoles: string[]): boolean {
    return requiredRoles.some(role => this.loadedUser()?.authorities?.includes(role) ?? false);
  }

  async loadUser(): Promise<void> {
    const isLoggedIn = this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      const token = this.keycloakService.getToken();
      const userShortDTO: UserShortDTO | null = await this.getCurrentUser();

      if (userShortDTO?.userId != null && token != null) {
        const user: User = {
          id: userShortDTO.userId,
          email: userShortDTO.email ?? '',
          name: `${userShortDTO.firstName} ${userShortDTO.lastName}`.trim() || 'User',
          bearer: token,
          authorities: userShortDTO.roles,
        };

        this.user.set(user);
        this.loaded.set(true);
      } else {
        this.user.set(undefined);
        this.loaded.set(true);
      }
    }
  }

  private async getCurrentUser(): Promise<UserShortDTO | null> {
    try {
      const user = await firstValueFrom(this.userResourceService.getCurrentUser());
      return user;
    } catch (error) {
      console.error('Failed to fetch authorities:', error);
      return null;
    }
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserResourceService } from 'app/generated/api/userResource.service';

import { ResearchGroupShortDTO, UserShortDTO } from '../../generated';

import { KeycloakService } from './keycloak.service';

export interface User {
  id: string;
  email: string;
  name: string;
  researchGroup?: ResearchGroupShortDTO;
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

  /**
   * Returns the id of the signed-in user, or undefined if no user is loaded.
   */
  get userId(): string | undefined {
    return this.loadedUser()?.id;
  }

  /**
   * Returns the email address of the signed-in user, or undefined if no user is loaded.
   */
  get userEmail(): string | undefined {
    return this.loadedUser()?.email;
  }

  /**
   * Returns the full name of the signed-in user, or undefined if no user is loaded.
   */
  get userName(): string | undefined {
    return this.loadedUser()?.name;
  }

  /**
   * Returns the research group of the signed-in user, or undefined if none is assigned or user is not loaded.
   */
  get userResearchGroup(): ResearchGroupShortDTO | undefined {
    return this.loadedUser()?.researchGroup;
  }

  /**
   * Returns the roles/authorities of the signed-in user, or undefined if not available.
   */
  get userAuthorities(): string[] | undefined {
    return this.loadedUser()?.authorities;
  }

  async signIn(redirectUri?: string): Promise<void> {
    await this.keycloakService.login(redirectUri);
    await this.loadUser();
  }

  async signOut(redirectUri?: string): Promise<void> {
    await this.keycloakService.logout(redirectUri);
  }

  hasAnyAuthority(requiredRoles: string[]): boolean {
    return requiredRoles.some(role => this.loadedUser()?.authorities?.includes(role) ?? false);
  }

  async loadUser(): Promise<void> {
    const token = this.keycloakService.getToken();
    const userShortDTO: UserShortDTO | null = await this.getCurrentUser();

    if (userShortDTO?.userId != null && token != null) {
      const user: User = {
        id: userShortDTO.userId,
        email: userShortDTO.email ?? '',
        name: `${userShortDTO.firstName} ${userShortDTO.lastName}`.trim() || 'User',
        researchGroup: userShortDTO.researchGroup ?? undefined,
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

import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ResearchGroupShortDTO } from '../../generated/model/research-group-short-dto';
import { UserResourceApi } from '../../generated/api/user-resource-api';
import { UserShortDTO } from '../../generated/model/user-short-dto';
import { formatFullName } from '../../shared/util/name.util';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  researchGroup?: ResearchGroupShortDTO;
  authorities?: string[];
}

/**
 * Purpose
 * -------
 * Provides a reactive, application-wide source of truth for the currently signed-in user.
 *
 * Responsibilities
 * ----------------
 *  - Loads the current user's information from the server (`loadUser`).
 *  - Exposes reactive signals (`user`, `loaded`, `signedIn`) to let components react to changes in user state.
 *  - Provides convenience getters for user properties such as id, email, name, research group and authorities.
 *  - Allows updates to the user profile (`updateUser`) and password (`updatePassword`).
 *  - Offers role-based checks (`hasAnyAuthority`) to simplify authorization logic in the UI.
 *
 * Notes
 * -----
 *  - This service does not handle authentication itself; it assumes that the server session or Keycloak
 *    has already established an authenticated context.
 *  - It relies on `UserResourceApi` for all server communication.
 *  - Errors when fetching the user are logged and result in `user` being set to `undefined` while `loaded` is true.
 */
@Injectable({ providedIn: 'root' })
export class AccountService {
  loaded = signal<boolean>(false);
  user = signal<User | undefined>(undefined);
  loadedUser = computed(() => (this.loaded() ? this.user() : undefined));
  signedIn = computed(() => {
    const user = this.user();
    return this.loaded() && user !== undefined;
  });
  private readonly userResourceApi = inject(UserResourceApi);

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

  hasAnyAuthority(requiredRoles: string[]): boolean {
    return requiredRoles.some(role => this.loadedUser()?.authorities?.includes(role) ?? false);
  }

  // Loads the user information from the server
  async loadUser(): Promise<void> {
    const userShortDTO: UserShortDTO | null = await this.getCurrentUser();

    if (userShortDTO?.userId != null) {
      const user: User = {
        id: userShortDTO.userId,
        email: userShortDTO.email ?? '',
        name: formatFullName(userShortDTO.firstName, userShortDTO.lastName) || 'User',
        avatar: userShortDTO.avatar,
        researchGroup: userShortDTO.researchGroup ?? undefined,
        authorities: userShortDTO.roles ? [...userShortDTO.roles] : undefined,
      };
      this.user.set(user);
      this.loaded.set(true);
    } else {
      this.user.set(undefined);
      this.loaded.set(true);
    }
  }

  async updateUser(firstName: string, lastName: string): Promise<void> {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    await firstValueFrom(
      this.userResourceApi.updateUserName({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      }),
    );
    await this.loadUser();
  }

  async updatePassword(password: string): Promise<void> {
    const trimmedPassword = password.trim();
    if (trimmedPassword) {
      await firstValueFrom(this.userResourceApi.updatePassword({ newPassword: trimmedPassword }));
    }
  }

  setAvatar(avatarUrl: string | undefined): void {
    this.user.update(currentUser => (currentUser ? Object.assign({}, currentUser, { avatar: avatarUrl }) : currentUser));
  }

  private async getCurrentUser(): Promise<UserShortDTO | null> {
    try {
      const user = await firstValueFrom(this.userResourceApi.getCurrentUser());
      return user;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }
}

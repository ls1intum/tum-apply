import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ResearchGroupShortDTO } from '../../generated/model/researchGroupShortDTO';
import { UserResourceApiService } from '../../generated/api/userResourceApi.service';
import { UserShortDTO } from '../../generated/model/userShortDTO';

export interface User {
  id: string;
  email: string;
  name: string;
  researchGroup?: ResearchGroupShortDTO;
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
  private readonly userResourceService = inject(UserResourceApiService);

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
        name: `${userShortDTO.firstName} ${userShortDTO.lastName}`.trim() || 'User',
        researchGroup: userShortDTO.researchGroup ?? undefined,
        authorities: userShortDTO.roles,
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
      this.userResourceService.updateUserName({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      }),
    );
    await this.loadUser();
  }

  async updatePassword(password: string): Promise<void> {
    const trimmedPassword = password.trim();
    if (trimmedPassword) {
      await firstValueFrom(this.userResourceService.updatePassword({ newPassword: trimmedPassword }));
    }
  }

  private async getCurrentUser(): Promise<UserShortDTO | null> {
    try {
      const user = await firstValueFrom(this.userResourceService.getCurrentUser());
      return user;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthenticationResourceService } from 'app/generated/api/authenticationResource.service';
import { AuthSessionInfoDTO } from 'app/generated/model/authSessionInfoDTO';

import { AccountService } from './account.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private refreshTimerId?: number;

  private authenticationResourceService = inject(AuthenticationResourceService);
  private accountService = inject(AccountService);

  // Login with email and password, schedule token refresh, and load user profile.
  async login(email: string, password: string): Promise<void> {
    // Call backend login endpoint: sets cookies and returns token lifetimes
    const resp: AuthSessionInfoDTO = await firstValueFrom(
      this.authenticationResourceService.login({
        email,
        password,
      }),
    );
    // Schedule a refresh 60 seconds before the access token expires
    this.scheduleRefresh(resp.expiresIn);
  }

  // Refreshes the access token
  async refresh(): Promise<void> {
    const resp = await firstValueFrom(this.authenticationResourceService.refresh());
    this.scheduleRefresh(resp.expiresIn);
  }

  // Logs out the user
  async logout(): Promise<void> {
    await firstValueFrom(this.authenticationResourceService.logout());
    this.accountService.user.set(undefined);
    this.accountService.loaded.set(true);
  }

  // Schedules a token refresh if the user is authenticated
  scheduleRefresh(expiresInSec: number | undefined): void {
    if (expiresInSec === undefined) {
      return;
    }
    // clear any existing timer
    if (this.refreshTimerId != null) {
      clearTimeout(this.refreshTimerId);
    }

    // refresh 60 seconds before token expiration
    const delayInMs = Math.max(0, (expiresInSec - 60) * 1000);
    this.refreshTimerId = window.setTimeout(() => {
      void this.refresh();
    }, delayInMs);
  }
}

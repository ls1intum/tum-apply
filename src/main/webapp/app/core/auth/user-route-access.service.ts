import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AccountService } from './account.service';

export const UserRouteAccessService: CanActivateFn = async (next: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const accountService = inject(AccountService);

  const requiredRoles: string[] = next.data['authorities'] ?? [];
  const publicOnly: boolean = next.data['publicOnly'] ?? false;

  // If route is publicOnly and user is logged in, redirect to home
  if (publicOnly && accountService.signedIn()) {
    await router.navigate(['/']);
    return false;
  }

  // If route requires authentication and user is not logged in, redirect to login
  if (!publicOnly && !accountService.signedIn()) {
    await accountService.signIn();
    return false;
  }

  // If no roles required or publicOnly route, allow access
  if (requiredRoles.length === 0 || publicOnly) {
    return true;
  }

  // Check authorities
  if (accountService.hasAnyAuthority(requiredRoles)) {
    return true;
  }

  console.warn('Access denied – missing roles:', requiredRoles);
  await router.navigate(['/accessdenied']);
  return false;
};

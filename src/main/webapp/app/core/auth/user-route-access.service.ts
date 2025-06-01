import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AccountService } from './account.service';

export const UserRouteAccessService: CanActivateFn = async (next: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const accountService = inject(AccountService);

  const authorities: string[] = next.data['authorities'] ?? [];
  const publicRoute: boolean = authorities.length === 0;

  // If no roles required, allow access
  if (publicRoute) {
    return true;
  }

  // If route requires authentication and user is not logged in, redirect to login
  if (!accountService.signedIn()) {
    await router.navigate(['/login']);
    return false;
  }

  // if route requires authentication and user is logged in, check authorities
  if (accountService.hasAnyAuthority(authorities)) {
    return true;
  }

  console.warn('Access denied – missing roles:', authorities);
  await router.navigate(['/accessdenied']);
  return false;
};

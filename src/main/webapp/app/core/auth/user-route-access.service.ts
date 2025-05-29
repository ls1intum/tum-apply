import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { keycloakService } from './keycloak.service';
import { AccountService } from './account.service';

export const UserRouteAccessService: CanActivateFn = (next: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const accountService = inject(AccountService);

  const requiredRoles: string[] = next.data['authorities'] ?? [];
  const publicOnly: boolean = next.data['publicOnly'] ?? false;

  // If route is publicOnly and user is logged in, redirect to home
  if (publicOnly && keycloakService.isLoggedIn()) {
    router.navigate(['/']);
    return of(false);
  }

  // If route requires authentication and user is not logged in, redirect to login
  if (!publicOnly && !keycloakService.isLoggedIn()) {
    keycloakService.login();
    return of(false);
  }

  // If no roles required or publicOnly route, allow access
  if (requiredRoles.length === 0 || publicOnly) {
    return of(true);
  }

  // Load user if not already loaded and roles are required
  return accountService.identity().pipe(
    map(() => {
      if (accountService.hasAnyAuthority(requiredRoles)) {
        return true;
      }

      console.warn('Access denied – missing roles:', requiredRoles);
      router.navigate(['/accessdenied']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/accessdenied']);
      return of(false);
    }),
  );
};

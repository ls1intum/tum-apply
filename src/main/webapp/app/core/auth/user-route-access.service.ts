import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { keycloakService } from './keycloak.service';
import { AccountService } from './account.service';

export const UserRouteAccessService: CanActivateFn = (next: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const accountService = inject(AccountService);

  const requiredRoles: string[] = next.data['authorities'] ?? [];

  // Not logged in? Redirect to Keycloak
  if (!keycloakService.isLoggedIn()) {
    keycloakService.login(); // redirect
    return of(false);
  }

  // Load user if not already loaded
  return accountService.identity().pipe(
    map(account => {
      if (!account) {
        router.navigate(['/accessdenied']);
        return false;
      }

      if (requiredRoles.length === 0 || accountService.hasAnyAuthority(requiredRoles)) {
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

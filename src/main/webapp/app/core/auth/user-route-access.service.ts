import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { AccountService } from './account.service';
import { AuthFacadeService } from './auth-facade.service';
import { IdpProvider } from './keycloak-authentication.service';

export const UserRouteAccessService: CanActivateFn = async (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const accountService = inject(AccountService);
  const authFacade = inject(AuthFacadeService);

  const authorities: string[] = next.data['authorities'] ?? [];
  const publicRoute: boolean = authorities.length === 0;

  // If no roles required, allow access
  if (publicRoute) {
    return true;
  }

  // If route requires authentication and user is not logged in, trigger Keycloak login
  if (!accountService.signedIn()) {
    // Build the full target URL to redirect back after login
    const targetUrl = window.location.origin + state.url;
    await authFacade.loginWithProvider(IdpProvider.TUM, targetUrl);
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

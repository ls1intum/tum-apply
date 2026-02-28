import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { AccountService } from './account.service';
import { AuthFacadeService } from './auth-facade.service';
import { AuthDialogService } from './auth-dialog.service';
import { IdpProvider } from './keycloak-authentication.service';

export const UserRouteAccessService: CanActivateFn = async (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const accountService = inject(AccountService);
  const authFacade = inject(AuthFacadeService);
  const authDialogService = inject(AuthDialogService);

  const authorities: string[] = next.data['authorities'] ?? [];
  const publicRoute: boolean = authorities.length === 0;

  // If no roles required, allow access
  if (publicRoute) {
    return true;
  }

  // If route requires authentication and user is not logged in, trigger login
  if (!accountService.signedIn()) {
    const targetUrl = window.location.origin + state.url;

    // For booking routes, open standard auth dialog (which has social buttons by default)
    if (state.url.startsWith('/interview-booking')) {
      authDialogService.open({ redirectUri: targetUrl });
      return false;
    }

    // For other routes, trigger Keycloak TUM login
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

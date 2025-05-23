import { inject, isDevMode } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs/operators';
import { AccountService } from 'app/core/auth/account.service';
import { LoginService } from 'app/pages/usermanagement/login/login.service';

import { StateStorageService } from './state-storage.service';

export const UserRouteAccessService: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const accountService = inject(AccountService);
  const router = inject(Router);
  const stateStorageService = inject(StateStorageService);
  const loginService = inject(LoginService);
  return accountService.identity().pipe(
    map(account => {
      if (account) {
        const { authorities } = next.data;

        if (!authorities || authorities.length === 0 || accountService.hasAnyAuthority(authorities)) {
          return true;
        }

        if (isDevMode()) {
          console.error('User does not have any of the required authorities:', authorities);
        }
        router.navigate(['accessdenied']);
        return false;
      }

      stateStorageService.storeUrl(state.url);
      loginService.login();
      return false;
    }),
  );
};

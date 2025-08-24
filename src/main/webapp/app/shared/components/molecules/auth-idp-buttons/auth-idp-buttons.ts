import { Component, computed, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';

import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { IdpProvider } from '../../../../core/auth/keycloak.service';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';

@Component({
  selector: 'jhi-auth-idp-buttons',
  standalone: true,
  imports: [ButtonGroupComponent],
  templateUrl: './auth-idp-buttons.html',
  styleUrl: './auth-idp-buttons.scss',
})
export class AuthIdpButtons {
  authFacadeService = inject(AuthFacadeService);
  breakpointObserver = inject(BreakpointObserver);

  readonly onlyIcons = toSignal(
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(
      map(state => state.matches),
      startWith(false),
    ),
    { initialValue: false },
  );

  readonly idpButtons = computed<ButtonGroupData>(() => ({
    direction: this.onlyIcons() ? 'horizontal' : 'vertical',
    fullWidth: true,
    buttons: [
      // TODO: Enable Microsoft login when available in Production environment
      {
        label: this.onlyIcons() ? undefined : 'Apple',
        icon: 'apple',
        severity: 'primary',
        variant: this.onlyIcons() ? 'text' : 'outlined',
        disabled: false,
        fullWidth: true,
        onClick: () => {
          void this.authFacadeService.loginWithProvider(IdpProvider.Apple, this.redirectUri());
        },
      },
      {
        label: this.onlyIcons() ? undefined : 'Google',
        icon: 'google',
        severity: 'primary',
        variant: this.onlyIcons() ? 'text' : 'outlined',
        disabled: false,
        fullWidth: true,
        onClick: () => {
          void this.authFacadeService.loginWithProvider(IdpProvider.Google, this.redirectUri());
        },
      },
    ],
  }));

  private redirectUri(): string {
    return window.location.origin;
  }
}

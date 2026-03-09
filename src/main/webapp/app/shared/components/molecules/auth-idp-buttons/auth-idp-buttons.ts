import { Component, computed, inject, input } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';

import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { IdpProvider } from '../../../../core/auth/keycloak-authentication.service';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';
import { AuthOrchestratorService } from '../../../../core/auth/auth-orchestrator.service';

@Component({
  selector: 'jhi-auth-idp-buttons',
  standalone: true,
  imports: [ButtonGroupComponent],
  templateUrl: './auth-idp-buttons.html',
  styleUrl: './auth-idp-buttons.scss',
})
export class AuthIdpButtons {
  authFacadeService = inject(AuthFacadeService);
  authOrchestratorService = inject(AuthOrchestratorService);
  breakpointObserver = inject(BreakpointObserver);
  isRegistration = input<boolean>(false);

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
      {
        label: this.onlyIcons() ? undefined : 'Apple',
        icon: 'apple',
        severity: 'primary',
        variant: this.onlyIcons() ? 'text' : 'outlined',
        disabled: false,
        fullWidth: true,
        onClick: () => {
          void this.authFacadeService.loginWithProvider(IdpProvider.Apple, this.redirectUri(), this.isRegistration());
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
          void this.authFacadeService.loginWithProvider(IdpProvider.Google, this.redirectUri(), this.isRegistration());
        },
      },
    ],
  }));

  private redirectUri(): string {
    return this.authOrchestratorService.redirectUri() ?? window.location.origin;
  }
}

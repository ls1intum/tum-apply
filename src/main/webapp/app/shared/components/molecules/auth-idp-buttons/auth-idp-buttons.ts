import { Component, computed, inject, input } from '@angular/core';

import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { IdpProvider } from '../../../../core/auth/keycloak-authentication.service';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';
import { AuthOrchestratorService } from '../../../../core/auth/auth-orchestrator.service';

@Component({
  selector: 'jhi-auth-idp-buttons',
  standalone: true,
  imports: [ButtonGroupComponent],
  templateUrl: './auth-idp-buttons.html',
})
export class AuthIdpButtons {
  authFacadeService = inject(AuthFacadeService);
  authOrchestratorService = inject(AuthOrchestratorService);
  isRegistration = input<boolean>(false);

  readonly idpButtons = computed<ButtonGroupData>(() => ({
    direction: 'vertical',
    fullWidth: true,
    buttons: [
      {
        label: 'Apple',
        icon: 'apple',
        severity: 'primary',
        variant: 'outlined',
        disabled: false,
        fullWidth: true,
        onClick: () => {
          void this.authFacadeService.loginWithProvider(IdpProvider.Apple, this.redirectUri(), this.isRegistration());
        },
      },
      {
        label: 'Google',
        icon: 'google',
        severity: 'primary',
        variant: 'outlined',
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

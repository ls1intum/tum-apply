import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { IdpProvider } from '../../../../core/auth/keycloak.service';
import TranslateDirective from '../../../language/translate.directive';
import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [ButtonGroupComponent, CommonModule, CredentialsGroupComponent, DividerModule, RouterModule, TranslateDirective],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthCardComponent {
  mode = signal<'login' | 'register'>('login');
  readonly isRegister = computed(() => this.mode() === 'register');

  authFacadeService = inject(AuthFacadeService);

  readonly idpButtons = computed<ButtonGroupData>(() => ({
    direction: 'vertical',
    fullWidth: true,
    buttons: [
      // TODO: Enable Microsoft login when available in Production environment
      {
        label: 'Apple',
        icon: 'apple',
        severity: 'primary',
        variant: 'outlined',
        disabled: false,
        fullWidth: true,
        onClick: () => {
          void this.authFacadeService.loginWithProvider(IdpProvider.Apple, this.redirectUri());
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
          void this.authFacadeService.loginWithProvider(IdpProvider.Google, this.redirectUri());
        },
      },
    ],
  }));

  onTUMSSOLogin(): void {
    this.authFacadeService.loginWithTUM(this.redirectUri());
  }

  onEmailLogin = (credentials: { email: string; password: string }): Promise<boolean> => {
    return this.authFacadeService.loginWithEmail(credentials.email, credentials.password, this.redirectUri());
  };

  toggleMode(): void {
    this.mode.set(this.mode() === 'register' ? 'login' : 'register');
  }

  private redirectUri(): string {
    return window.location.origin;
  }
}

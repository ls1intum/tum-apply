import { Component, Signal, ViewEncapsulation, inject, input } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

import { ButtonComponent } from '../../atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { AuthTabService } from '../../../../core/auth/auth-tab.service';
import { AccountService } from '../../../../core/auth/account.service';
import { IdpProvider, KeycloakService } from '../../../../core/auth/keycloak.service';
import { EmailLoginResourceService } from '../../../../generated';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [ButtonComponent, ButtonGroupComponent, CommonModule, DividerModule, TabsModule, RouterModule, TranslateDirective],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthCardComponent {
  mode = input<'login' | 'register'>('login');
  redirectUri = input<string>('/');

  authTabService = inject(AuthTabService);
  value: Signal<number> = this.authTabService.getSelectedTab();
  accountService = inject(AccountService);
  keycloakService = inject(KeycloakService);
  emailLoginResourceService = inject(EmailLoginResourceService);

  onTabChange(newValue: string | number): void {
    this.authTabService.setSelectedTab(Number(newValue));
  }

  identityProvider(): ButtonGroupData {
    return {
      direction: 'vertical',
      fullWidth: true,
      buttons: [
        {
          label: this.mode() === 'register' ? 'register.buttons.tum' : 'login.buttons.tum',
          severity: 'primary',
          variant: 'outlined',
          disabled: false,
          fullWidth: true,
          onClick: () => this.onTUMSSOLogin(),
        },
        // TODO: Enable Microsoft login when available in Production environment
        {
          label: this.mode() === 'register' ? 'register.buttons.apple' : 'login.buttons.apple',
          icon: 'apple',
          severity: 'primary',
          variant: 'outlined',
          disabled: false,
          fullWidth: true,
          onClick: () => this.onAppleLogin(),
        },
        {
          label: this.mode() === 'register' ? 'register.buttons.google' : 'login.buttons.google',
          icon: 'google',
          severity: 'primary',
          variant: 'outlined',
          disabled: false,
          fullWidth: true,
          onClick: () => this.onGoogleLogin(),
        },
      ],
    };
  }

  onTUMSSOLogin(): void {
    this.keycloakService.login(this.redirectUri());
  }

  onMicrosoftLogin(): void {
    this.keycloakService.loginWithProvider(IdpProvider.Microsoft, this.redirectUri());
  }

  onGoogleLogin(): void {
    this.keycloakService.loginWithProvider(IdpProvider.Google, this.redirectUri());
  }

  onAppleLogin(): void {
    this.keycloakService.loginWithProvider(IdpProvider.Apple, this.redirectUri());
  }

  onEmailLogin = (): void => {
    this.keycloakService.login(this.redirectUri());
    /* const { email, password } = credentials;
                                                            this.emailLoginResourceService
                                                              .login(
                                                                {
                                                                  email,
                                                                  password,
                                                                },
                                                                'response',
                                                              )
                                                              .subscribe({
                                                                next: async response => {
                                                                  await this.accountService.loadUser();
                                                                  },
                                                              });*/
  };
}

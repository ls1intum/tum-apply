import { Component, Signal, inject, input } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { ButtonComponent } from '../../atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { AuthTabService } from '../../../../core/auth/auth-tab.service';
import { AccountService } from '../../../../core/auth/account.service';
import { KeycloakService } from '../../../../core/auth/keycloak.service';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [ButtonComponent, ButtonModule, ButtonGroupComponent, CommonModule, DividerModule, TabsModule, RouterModule],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
})
export class AuthCardComponent {
  mode = input<'login' | 'register'>('login');
  redirectUri = input<string>('/');

  authTabService = inject(AuthTabService);
  value: Signal<number> = this.authTabService.getSelectedTab();
  accountService = inject(AccountService);
  keycloakService = inject(KeycloakService);

  onTabChange(newValue: string | number): void {
    this.authTabService.setSelectedTab(Number(newValue));
  }

  defaultLoginProvider(): ButtonGroupData {
    return {
      direction: 'vertical',
      buttons: [
        {
          label: this.mode() === 'register' ? 'Register with Email' : 'Sign in with Email',
          icon: 'at',
          severity: 'primary',
          disabled: false,
          onClick: () => this.onMicrosoftLogin(),
        },
        {
          label: this.mode() === 'register' ? 'Register with TUM' : 'Sign in with TUM',
          severity: 'primary',
          variant: 'outlined',
          disabled: false,
          onClick() {},
        },
      ],
    };
  }

  identityProvider(): ButtonGroupData {
    return {
      direction: 'vertical',
      buttons: [
        {
          label: this.mode() === 'register' ? 'Register with Microsoft' : 'Sign in with Microsoft',
          icon: 'microsoft',
          severity: 'primary',
          variant: 'outlined',
          disabled: false,
          onClick: () => this.onMicrosoftLogin(),
        },
        {
          label: this.mode() === 'register' ? 'Register with Apple' : 'Sign in with Apple',
          icon: 'apple',
          severity: 'primary',
          variant: 'outlined',
          disabled: false,
          onClick() {},
        },
        {
          label: this.mode() === 'register' ? 'Register with Google' : 'Sign in with Google',
          icon: 'google',
          severity: 'primary',
          variant: 'outlined',
          disabled: false,
          onClick() {},
        },
      ],
    };
  }

  onTUMSSOLogin(): void {
    void this.accountService.signIn(this.redirectUri());
  }

  onMicrosoftLogin(): void {
    this.keycloakService.loginWithProvider('microsoft', this.redirectUri());
  }
}

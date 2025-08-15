import { Component, Signal, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ToastService } from 'app/service/toast-service';
import { ToastComponent } from 'app/shared/toast/toast.component';
import { TranslateService } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { AuthTabService } from '../../../../core/auth/auth-tab.service';
import { IdpProvider } from '../../../../core/auth/keycloak.service';
import TranslateDirective from '../../../language/translate.directive';
import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [
    ButtonComponent,
    ButtonGroupComponent,
    CommonModule,
    CredentialsGroupComponent,
    DividerModule,
    TabsModule,
    RouterModule,
    TranslateDirective,
    ToastComponent,
  ],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthCardComponent {
  authFacadeService = inject(AuthFacadeService);
  authTabService = inject(AuthTabService);
  config = inject(DynamicDialogConfig);
  toastService = inject(ToastService);
  translate = inject(TranslateService);

  mode = signal<'login' | 'register'>('login');
  readonly isRegister = computed(() => this.mode() === 'register');

  value: Signal<number> = this.authTabService.getSelectedTab();

  readonly idpButtons = computed<ButtonGroupData>(() => ({
    direction: 'vertical',
    fullWidth: true,
    buttons: [
      {
        label: this.mode() === 'register' ? 'register.buttons.tum' : 'login.buttons.tum',
        severity: 'primary',
        variant: 'outlined',
        disabled: false,
        fullWidth: true,
        onClick: this.onTUMSSOLogin.bind(this),
      },
      // TODO: Enable Microsoft login when available in Production environment
      {
        label: this.mode() === 'register' ? 'register.buttons.apple' : 'login.buttons.apple',
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
        label: this.mode() === 'register' ? 'register.buttons.google' : 'login.buttons.google',
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

  onTabChange(newValue: string | number): void {
    this.authTabService.setSelectedTab(Number(newValue));
  }

  onTUMSSOLogin(): void {
    this.authFacadeService.loginWithTUM(this.redirectUri());
  }

  onEmailLogin = async (credentials: { email: string; password: string }): Promise<void> => {
    try {
      await this.authFacadeService.loginWithEmail(credentials.email, credentials.password, this.redirectUri());
    } catch {
      this.toastService.showError({
        summary: this.translate.instant('global.messages.validate.error.header'),
        detail: this.translate.instant('global.messages.validate.error.message'),
      });
    }
  };

  toggleMode(): void {
    this.mode.set(this.mode() === 'register' ? 'login' : 'register');
  }

  private redirectUri(): string {
    return this.config.data?.redirectUri ? `${window.location.origin}${this.config.data.redirectUri}` : window.location.origin;
  }
}

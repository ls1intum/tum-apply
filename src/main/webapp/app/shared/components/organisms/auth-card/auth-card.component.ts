import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ToastService } from 'app/service/toast-service';
import { TranslateService } from '@ngx-translate/core';

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
  breakpointObserver = inject(BreakpointObserver);
  config = inject(DynamicDialogConfig);
  toastService = inject(ToastService);
  translate = inject(TranslateService);

  readonly onlyIcons = toSignal(
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(
      map(state => state.matches),
      startWith(false),
    ),
    { initialValue: false },
  );

  readonly idpButtons = computed<ButtonGroupData>(() => ({
    direction: this.onlyIcons() ? 'horizontal' : 'vertical',
    fullWidth: !this.onlyIcons(),
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

  onEmailLogin = async (credentials: { email: string; password: string }): Promise<boolean> => {
    const response = await this.authFacadeService.loginWithEmail(credentials.email, credentials.password, this.redirectUri());
    if (!response) {
      this.toastService.showError({
        summary: this.translate.instant('login.messages.error.header'),
        detail: this.translate.instant('login.messages.error.message'),
      });
    }
    return response;
  };

  toggleMode(): void {
    this.mode.set(this.mode() === 'register' ? 'login' : 'register');
  }

  private redirectUri(): string {
    return this.config.data?.redirectUri ? `${window.location.origin}${this.config.data.redirectUri}` : window.location.origin;
  }
}

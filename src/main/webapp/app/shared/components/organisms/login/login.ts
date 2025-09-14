import { Component, computed, inject } from '@angular/core';
import { ToastService } from 'app/service/toast-service';
import { TranslateService } from '@ngx-translate/core';

import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { TranslateDirective } from '../../../language';
import { AuthService } from '../../../auth/data-access/auth.service';

@Component({
  selector: 'jhi-login',
  imports: [CredentialsGroupComponent, TranslateDirective],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  authFacadeService = inject(AuthFacadeService);
  authOrchestrator = inject(AuthOrchestratorService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  translate = inject(TranslateService);

  showPassword = computed(() => this.authOrchestrator.loginStep() === 'password');

  submitHandler = async (email: string, password?: string): Promise<boolean> => {
    if (this.showPassword()) {
      return this.onEmailLogin(email, password);
    }
    this.authOrchestrator.email.set(email);
    await this.authService.sendOtp(false);
    return Promise.resolve(true);
  };

  secondButtonHandler = (): void => {
    this.authOrchestrator.loginStep.set('password');
  };

  onEmailLogin = async (email: string, password?: string): Promise<boolean> => {
    if (password == null || password.trim() === '') {
      return false;
    }
    const response = await this.authFacadeService.loginWithEmail(email, password, this.redirectUri());
    if (!response) {
      this.toastService.showError({
        summary: this.translate.instant('auth.login.messages.error.header'),
        detail: this.translate.instant('auth.login.messages.error.wrongCredentials'),
      });
    }
    return response;
  };

  private redirectUri(): string {
    return window.location.origin;
  }
}

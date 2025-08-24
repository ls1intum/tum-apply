import { Component, ViewEncapsulation, inject } from '@angular/core';
import { ToastService } from 'app/service/toast-service';
import { TranslateService } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';

import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { AuthIdpButtons } from '../../molecules/auth-idp-buttons/auth-idp-buttons';
import { TranslateDirective } from '../../../language';

@Component({
  selector: 'jhi-login',
  standalone: true,
  imports: [AuthIdpButtons, CredentialsGroupComponent, DividerModule, TranslateDirective],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Login {
  authFacadeService = inject(AuthFacadeService);
  authOrchestrator = inject(AuthOrchestratorService);
  toastService = inject(ToastService);
  translate = inject(TranslateService);

  onEmailLogin = async (credentials: { email: string; password?: string }): Promise<boolean> => {
    if (credentials.password == null || credentials.password.trim() === '') {
      return false;
    }
    const response = await this.authFacadeService.loginWithEmail(credentials.email, credentials.password, this.redirectUri());
    if (!response) {
      this.toastService.showError({
        summary: this.translate.instant('auth.login.messages.error.header'),
        detail: this.translate.instant('auth.login.messages.error.message'),
      });
    }
    return response;
  };

  private redirectUri(): string {
    return window.location.origin;
  }
}

import { Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { ProgressBar } from 'primeng/progressbar';

import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { AuthService } from '../../../auth/data-access/auth.service';
import { AuthIdpButtons } from '../../molecules/auth-idp-buttons/auth-idp-buttons';

@Component({
  selector: 'jhi-registration',
  standalone: true,
  imports: [CredentialsGroupComponent, DividerModule, ProgressBar, AuthIdpButtons],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Registration {
  authService = inject(AuthService);
  authOrchestrator = inject(AuthOrchestratorService);

  readonly registerProgress = computed(() => this.authOrchestrator.registerProgress() * 100);

  sendOtp = async (credentials: { email: string }): Promise<boolean> => {
    const normalized = credentials.email.trim();
    if (!normalized) {
      return false;
    }
    this.authOrchestrator.email.set(normalized);
    await this.authService.sendOtp(true);
    return true;
  };
}

import { Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { ProgressBar } from 'primeng/progressbar';
import { TranslateModule } from '@ngx-translate/core';

import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { AuthService } from '../../../auth/data-access/auth.service';
import { AuthIdpButtons } from '../../molecules/auth-idp-buttons/auth-idp-buttons';
import { TranslateDirective } from '../../../language';
import { OtpInput } from '../../atoms/otp-input/otp-input';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-registration',
  standalone: true,
  imports: [
    AuthIdpButtons,
    CredentialsGroupComponent,
    DividerModule,
    ProgressBar,
    OtpInput,
    ReactiveFormsModule,
    TranslateDirective,
    TranslateModule,
    ButtonComponent,
  ],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Registration {
  authService = inject(AuthService);
  authOrchestrator = inject(AuthOrchestratorService);

  readonly registerProgress = computed(() => this.authOrchestrator.registerProgress());
  readonly totalRegisterSteps = this.authOrchestrator.totalRegisterSteps;
  readonly registerProgressInPercent = computed(() => ((this.registerProgress() - 1) / (this.totalRegisterSteps - 1)) * 100);
  readonly showBackButton = computed(() => this.authOrchestrator.registerStep() === 'verify');
  readonly showSkipButton = computed(
    () => this.authOrchestrator.registerStep() === 'profile' || this.authOrchestrator.registerStep() === 'password',
  );

  sendOtp = async (email: string): Promise<boolean> => {
    const normalized = email.trim();
    if (!normalized) {
      return false;
    }
    this.authOrchestrator.email.set(normalized);
    await this.authService.sendOtp(true);
    return true;
  };

  onBack = (): void => {
    this.authOrchestrator.previousRegisterStep();
  };

  onSkip = (): void => {
    this.authOrchestrator.nextRegisterStep();
  };
}

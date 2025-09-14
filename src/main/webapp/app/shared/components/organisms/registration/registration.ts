import { Component, computed, inject } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';

import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { AuthService } from '../../../auth/data-access/auth.service';
import { TranslateDirective } from '../../../language';
import { OtpInput } from '../../atoms/otp-input/otp-input';
import { ButtonComponent } from '../../atoms/button/button.component';
import { PasswordInputComponent } from '../../atoms/password-input/password-input';
import { ProfileComponent } from '../../molecules/profile/profile.component';

@Component({
  selector: 'jhi-registration',
  imports: [
    ButtonComponent,
    CredentialsGroupComponent,
    OtpInput,
    ProgressBar,
    TranslateDirective,
    PasswordInputComponent,
    ProfileComponent,
  ],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
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

import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProgressBar } from 'primeng/progressbar';

import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthOrchestratorService } from '../../../../core/auth/auth-orchestrator.service';
import { TranslateDirective } from '../../../language';
import { OtpInput } from '../../atoms/otp-input/otp-input';
import { ButtonComponent } from '../../atoms/button/button.component';
import { PasswordInputComponent } from '../../atoms/password-input/password-input';
import { ProfileComponent } from '../../molecules/profile/profile.component';
import { AccountService } from '../../../../core/auth/account.service';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';

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
    ReactiveFormsModule,
  ],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
})
export class Registration {
  readonly authFacade = inject(AuthFacadeService);
  readonly accountService = inject(AccountService);
  readonly authOrchestrator = inject(AuthOrchestratorService);

  readonly registerProgress = computed(() => this.authOrchestrator.registerProgress());
  readonly totalRegisterSteps = this.authOrchestrator.totalRegisterSteps;
  readonly registerProgressInPercent = computed(() => ((this.registerProgress() - 1) / (this.totalRegisterSteps - 1)) * 100);
  readonly showBackButton = computed(() => this.authOrchestrator.registerStep() === 'otp');
  readonly showSkipButton = computed(() => this.authOrchestrator.registerStep() === 'password');

  passwordForm: FormGroup<{ password: FormControl<string> }>;

  constructor() {
    const fb = inject(FormBuilder);
    this.passwordForm = fb.nonNullable.group({
      password: [''],
    });
  }

  sendOtp = async (email: string): Promise<boolean> => {
    const normalized = email.trim();
    if (!normalized) {
      return false;
    }
    this.authOrchestrator.email.set(normalized);
    await this.authFacade.requestOtp(true);
    return true;
  };

  setProfile = async (firstName: string, lastName: string): Promise<void> => {
    await this.runWithOrchestratorBusy(async () => {
      await this.accountService.updateUser(firstName, lastName);
      this.authOrchestrator.nextStep();
    }, 'Could not update your profile name. Please try again.');
  };

  setPassword = async (): Promise<void> => {
    const { password } = this.passwordForm.getRawValue();
    await this.runWithOrchestratorBusy(async () => {
      await this.accountService.updatePassword(password);
      this.authOrchestrator.nextStep();
    }, 'Could not update your password. Please try again.');
  };

  onBack = (): void => {
    this.authOrchestrator.previousStep();
  };

  onSkip = (): void => {
    this.authOrchestrator.nextStep();
  };

  /**
   * Helper to run an async action while setting isBusy=true on the AuthOrchestrator,
   * catching errors and reporting them to the orchestrator.
   *
   * @param action The async function to execute
   * @param errorMessage Optional custom error message to show if the action fails
   */
  private async runWithOrchestratorBusy(action: () => Promise<void>, errorMessage = 'An error occurred. Please try again.'): Promise<void> {
    this.authOrchestrator.isBusy.set(true);
    try {
      await action();
    } catch {
      this.authOrchestrator.setError(errorMessage);
    } finally {
      this.authOrchestrator.isBusy.set(false);
    }
  }
}

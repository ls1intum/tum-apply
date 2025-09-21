import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProgressBar } from 'primeng/progressbar';

import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { AuthService } from '../../../auth/data-access/auth.service';
import { TranslateDirective } from '../../../language';
import { OtpInput } from '../../atoms/otp-input/otp-input';
import { ButtonComponent } from '../../atoms/button/button.component';
import { PasswordInputComponent } from '../../atoms/password-input/password-input';
import { ProfileComponent } from '../../molecules/profile/profile.component';
import { AccountService } from '../../../../core/auth/account.service';
import { UserResourceApiService } from '../../../../generated/api/userResourceApi.service';

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
  authService = inject(AuthService);
  authOrchestrator = inject(AuthOrchestratorService);
  userResource = inject(UserResourceApiService);
  accountService = inject(AccountService);

  readonly registerProgress = computed(() => this.authOrchestrator.registerProgress());
  readonly totalRegisterSteps = this.authOrchestrator.totalRegisterSteps;
  readonly registerProgressInPercent = computed(() => ((this.registerProgress() - 1) / (this.totalRegisterSteps - 1)) * 100);
  readonly showBackButton = computed(() => this.authOrchestrator.registerStep() === 'verify');
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
    await this.authService.sendOtp(true);
    return true;
  };

  setProfile = async (firstName: string, lastName: string): Promise<void> => {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    this.authOrchestrator.isBusy.set(true);
    try {
      await firstValueFrom(
        this.userResource.updateUserName({
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
        }),
      );
      await this.accountService.loadUser();
      this.authOrchestrator.nextRegisterStep();
    } catch {
      this.authOrchestrator.setError('Could not update your profile name. Please try again.');
    } finally {
      this.authOrchestrator.isBusy.set(false);
    }
  };

  onSubmitPassword = async (): Promise<void> => {
    const { password } = this.passwordForm.getRawValue();
    const trimmedPassword = password.trim();
    if (trimmedPassword) {
      await firstValueFrom(this.userResource.updatePassword({ newPassword: trimmedPassword }));
    }
    this.authOrchestrator.nextRegisterStep();
  };

  onBack = (): void => {
    this.authOrchestrator.previousRegisterStep();
  };

  onSkip = (): void => {
    this.authOrchestrator.nextRegisterStep();
  };
}

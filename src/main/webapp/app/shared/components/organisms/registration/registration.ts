import { Component, computed, inject } from '@angular/core';
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
import { UserResourceService } from '../../../../generated';
import { AccountService } from '../../../../core/auth/account.service';

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
  userResource = inject(UserResourceService);
  accuntService = inject(AccountService);

  readonly registerProgress = computed(() => this.authOrchestrator.registerProgress());
  readonly totalRegisterSteps = this.authOrchestrator.totalRegisterSteps;
  readonly registerProgressInPercent = computed(() => ((this.registerProgress() - 1) / (this.totalRegisterSteps - 1)) * 100);
  readonly showBackButton = computed(() => this.authOrchestrator.registerStep() === 'verify');
  readonly showSkipButton = computed(() => this.authOrchestrator.registerStep() === 'password');

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
      await this.accuntService.loadUser();
      // TODO: set name in header
      this.authOrchestrator.nextRegisterStep();
    } catch {
      this.authOrchestrator.setError('Could not update your profile name. Please try again.');
    } finally {
      this.authOrchestrator.isBusy.set(false);
    }
  };

  submitPassword = (password: string): void => {
    const trimmed = password.trim();
    if (!trimmed) {
      return;
    }
    // TODO: set password for user in Keycloak
  };

  onBack = (): void => {
    this.authOrchestrator.previousRegisterStep();
  };

  onSkip = (): void => {
    this.authOrchestrator.nextRegisterStep();
  };
}

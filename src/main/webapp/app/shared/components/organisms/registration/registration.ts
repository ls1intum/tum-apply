import { Component, ViewEncapsulation, computed, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { ProgressBar } from 'primeng/progressbar';
import { TranslateModule } from '@ngx-translate/core';

import { CredentialsGroupComponent } from '../../molecules/credentials-group/credentials-group.component';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { AuthService } from '../../../auth/data-access/auth.service';
import { AuthIdpButtons } from '../../molecules/auth-idp-buttons/auth-idp-buttons';
import { TranslateDirective } from '../../../language';
import { OtpInput } from '../../atoms/otp-input/otp-input';
import { StringInputComponent } from '../../atoms/string-input/string-input.component';

@Component({
  selector: 'jhi-registration',
  standalone: true,
  imports: [
    AuthIdpButtons,
    CredentialsGroupComponent,
    DividerModule,
    ProgressBar,
    OtpInput,
    StringInputComponent,
    ReactiveFormsModule,
    TranslateDirective,
    TranslateModule,
  ],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Registration {
  authService = inject(AuthService);
  authOrchestrator = inject(AuthOrchestratorService);

  readonly emailDisplayControl = new FormControl<string>({ value: '', disabled: true }, { nonNullable: true });
  readonly registerProgress = computed(() => this.authOrchestrator.registerProgress() * 100);

  constructor() {
    effect(() => {
      // keep the readonly control in sync with the orchestrator email
      this.emailDisplayControl.setValue(this.authOrchestrator.email(), { emitEvent: false });
    });
  }

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

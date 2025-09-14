import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthenticationResourceService, EmailVerificationResourceService, OtpCompleteDTO, UserProfileDTO } from '../../../generated';
import { EmailLoginResourceService } from '../../../generated/api/emailLoginResource.service';

@Injectable({ providedIn: 'root' })
export class AuthGateway {
  private readonly emailAuthApi = inject(EmailLoginResourceService);
  private readonly verificationApi = inject(EmailVerificationResourceService);
  private readonly authenticationApi = inject(AuthenticationResourceService);

  // --------- Shared -----------

  // Sends an OTP (one-time password) via email.
  sendOtp(email: string): Promise<unknown> {
    return firstValueFrom(this.verificationApi.send({ email }));
  }

  // Verifies OTP code for login or registration.
  verifyOtp(email: string, code: string, isRegistration: boolean, profile?: UserProfileDTO): Promise<unknown> {
    return firstValueFrom(
      this.authenticationApi.otpComplete({
        email,
        code,
        profile,
        purpose: isRegistration ? OtpCompleteDTO.PurposeEnum.Register : OtpCompleteDTO.PurposeEnum.Login,
      }),
    );
  }

  // -------- Login flow ----------

  // Logs in using email and password.
  loginPassword(email: string, password: string): Promise<unknown> {
    return firstValueFrom(this.emailAuthApi.login({ email, password }));
  }

  // TODO: create registration api calls
}

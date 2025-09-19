import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { EmailVerificationResourceApiService } from '../../../generated/api/emailVerificationResourceApi.service';
import { AuthenticationResourceApiService } from '../../../generated/api/authenticationResourceApi.service';
import { OtpCompleteDTO } from '../../../generated/model/otpCompleteDTO';
import { UserProfileDTO } from '../../../generated/model/userProfileDTO';
import { AuthSessionInfoDTO } from '../../../generated/model/authSessionInfoDTO';

@Injectable({ providedIn: 'root' })
export class AuthGateway {
  private readonly emailAuthApi = inject(AuthenticationResourceApiService);
  private readonly verificationApi = inject(EmailVerificationResourceApiService);
  private readonly authenticationApi = inject(AuthenticationResourceApiService);

  // --------- Shared -----------

  // Sends an OTP (one-time password) via email.
  sendOtp(email: string, registration: boolean): Promise<unknown> {
    return firstValueFrom(this.verificationApi.send({ email, registration }));
  }

  // Verifies OTP code for login or registration.
  verifyOtp(email: string, code: string, isRegistration: boolean, profile?: UserProfileDTO): Promise<AuthSessionInfoDTO> {
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

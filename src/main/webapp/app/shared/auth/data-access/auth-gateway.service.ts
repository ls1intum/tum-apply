import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { EmailVerificationResourceService } from '../../../generated';
import { EmailLoginResourceService } from '../../../generated/api/emailLoginResource.service';

@Injectable({ providedIn: 'root' })
export class AuthGateway {
  private readonly emailAuthApi = inject(EmailLoginResourceService);
  private readonly verificationApi = inject(EmailVerificationResourceService);

  // --------- Shared -----------

  // Sends an OTP (one-time password) via email.
  sendOtp(email: string): Promise<unknown> {
    return firstValueFrom(this.verificationApi.send({ email }));
  }

  // Verifies OTP code for login or registration.
  verifyOtp(email: string, code: string): Promise<unknown> {
    return firstValueFrom(this.verificationApi.verify({ email, code }));
  }

  // -------- Login flow ----------

  // Logs in using email and password.
  loginPassword(email: string, password: string): Promise<unknown> {
    return firstValueFrom(this.emailAuthApi.login({ email, password }));
  }

  // TODO: create registration api calls
  // -------- Registration flow ----------

  /*
  // Starts registration by sending a verification code to the email.
  registerStart(email: string): Promise<any> {
    return firstValueFrom(this.regApi.registerStart({ email }));
  }

  // Verifies the code sent to the email during registration.
  registerVerify(email: string, code: string): Promise<any> {
    return firstValueFrom(this.regApi.registerVerify({ email, code }));
  }

  // Saves user's profile data and consents during registration.
  registerProfile(token: string, firstName: string, lastName: string, consents: unknown): Promise<any> {
    return firstValueFrom(this.regApi.registerProfile({ token, firstName, lastName, consents }));
  }

  // Sets the password for the user during registration.
  registerSetPassword(token: string, password: string): Promise<any> {
    return firstValueFrom(this.regApi.registerSetPassword({ token, password }));
  }

  // --- "Apply" registration
  // Starts "apply" registration by sending a code and creating a registration intent.
  applyInlineSendCode(email: string, firstName: string, lastName: string): Promise<any> {
    // server should start a registration intent and return cooldown
    return firstValueFrom(this.regApi.applyInlineStart({ email, firstName, lastName }));
  }

  // Verifies the code for "apply" registration, returning a registration token or logging in.
  applyInlineVerify(email: string, code: string): Promise<any> {
    // server returns registrationToken (or directly logs in if you prefer)
    return firstValueFrom(this.regApi.applyInlineVerify({ email, code }));
  }*/
}

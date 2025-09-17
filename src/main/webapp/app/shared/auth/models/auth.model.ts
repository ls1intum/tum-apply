/**
 * Modes the dialog can run in
 * - 'login'         : regular login flow
 * - 'register'      : regular registration flow (verify -> profile -> optional password)
 * - 'apply-register': embedded, inline registration during job apply
 */
export type AuthFlowMode = 'login' | 'register' | 'apply-register';

export interface AuthOpenOptions {
  mode?: AuthFlowMode;
  prefill?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  // optional callback when user is fully authenticated
  onSuccess?: () => void;
}

// Substates within the login flow:
// - 'email'    : user enters their email (decides between password or OTP)
// - 'password' : user is prompted for their password
// - 'otp'      : user enters a one-time code sent by email
export type LoginStep = 'email' | 'password' | 'otp';

// Steps within the registration flow:
// - 'email'    : user enters their email
// - 'verify'   : user verifies their email with a code
// - 'profile'   : user enters first name, last name, and consents
// - 'password' : optional step to set a password for future logins
export const REGISTER_STEPS = ['email', 'verify', 'profile', 'password'] as const;
export type RegisterStep = (typeof REGISTER_STEPS)[number];

// Steps for the inline "apply" registration flow (during job application):
// - 'inline'   : user provides email + names and requests a code
// - 'verified'  : email successfully verified, host form can proceed
// - 'password' : optional step to set a password after applying
export type ApplyStep = 'inline' | 'verified' | 'password';

export interface PrefaceResponse {
  authContext: string;
  methods?: ('password' | 'otp' | 'sso')[];
  otp?: { cooldownSeconds?: number };
}

export interface CooldownResponse {
  cooldownSeconds?: number;
}

export interface RegisterVerifyResponse {
  registrationToken: string;
}

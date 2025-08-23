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

export type LoginSubState = 'email' | 'password' | 'otp';
export type RegisterStep = 'email' | 'verify' | 'profile' | 'password';
export type ApplyStep = 'inline' | 'verified' | 'password'; // for embedded flow

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

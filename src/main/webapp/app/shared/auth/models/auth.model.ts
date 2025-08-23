export type AuthMode = 'login' | 'register';
export type LoginSubState = 'email' | 'password' | 'otp';
export type RegisterStep = 'verify' | 'profile' | 'password';

export interface PrefaceResponse {
  authContext: string;
  methods?: ('password' | 'otp' | 'sso')[];
  otp?: { cooldownSeconds?: number; requiresCaptcha?: boolean };
}

export interface CooldownResponse {
  cooldownSeconds?: number;
}
export interface RegisterVerifyResponse {
  registrationToken: string;
}

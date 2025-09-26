export interface ApplicationConfig {
  keycloak?: KeycloakConfig;
  otp?: OtpConfig;
}

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
}

export interface OtpConfig {
  length: number;
  ttlSeconds: number;
  resendCooldownSeconds: number;
}

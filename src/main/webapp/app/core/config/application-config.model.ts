export interface ApplicationConfig {
  keycloak?: KeycloakConfig;
  otp?: OtpConfig;
}

export interface KeycloakConfig {
  url: string;
  tumLoginRealm: string;
  externalLoginRealm: string;
  clientId: string;
  relyingPartyId: string;
  externalRelyingPartyId: string;
}

export interface OtpConfig {
  length: number;
  ttlSeconds: number;
  resendCooldownSeconds: number;
}

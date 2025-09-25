import { Injectable } from '@angular/core';
import { ApplicationConfig, KeycloakConfig, OtpConfig } from 'app/core/config/application-config.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationConfigService {
  private _config?: ApplicationConfig;

  /**
   * Convenience getters with sane defaults
   */

  /** Returns the entire Keycloak configuration or sensible defaults */
  get keycloak(): KeycloakConfig {
    const keycloak = this.getAppConfig().keycloak;
    return {
      url: keycloak?.url ?? '',
      realm: keycloak?.realm ?? '',
      clientId: keycloak?.clientId ?? '',
    };
  }

  /** Returns the entire OTP configuration or sensible defaults */
  get otp(): OtpConfig {
    const otp = this.getAppConfig().otp;
    return {
      length: otp?.length ?? 6,
      ttlSeconds: otp?.ttlSeconds ?? 300,
      resendCooldownSeconds: otp?.resendCooldownSeconds ?? 60,
    };
  }

  getEndpointFor(api: string): string {
    return api;
  }

  setAppConfig(config: ApplicationConfig): void {
    this._config = Object.freeze(structuredClone(config));
  }

  getAppConfig(): ApplicationConfig {
    if (!this._config) throw new Error('ApplicationConfig not initialized yet');
    return this._config;
  }
}

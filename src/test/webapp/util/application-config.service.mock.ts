import { Provider, Type } from '@angular/core';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { ApplicationConfig, KeycloakConfig, OtpConfig } from 'app/core/config/application-config.model';
import { vi } from 'vitest';

/**
 * A full mock reflecting the real ApplicationConfigService API.
 */
export interface ApplicationConfigServiceMock extends Partial<ApplicationConfigService> {
  keycloak?: KeycloakConfig;
  otp: OtpConfig;
  appConfig?: Partial<ApplicationConfig>;
}

/**
 * Factory that creates a realistic mock of the ApplicationConfigService.
 */
export function createApplicationConfigServiceMock(overrides: Partial<ApplicationConfigServiceMock> = {}): ApplicationConfigServiceMock {
  const defaultConfig: ApplicationConfigServiceMock = {
    keycloak: {
      url: 'http://mock-keycloak',
      realm: 'mock-realm',
      clientId: 'mock-client',
      ...overrides.keycloak,
    },
    otp: {
      length: 6,
      ttlSeconds: 300,
      resendCooldownSeconds: 60,
      ...overrides.otp,
    },
    appConfig: {
      ...overrides.appConfig,
    },
    setAppConfig: vi.fn(),
    getAppConfig: vi.fn(),
    getEndpointFor: vi.fn(api => api),
  };

  return {
    ...defaultConfig,
    ...overrides,
  };
}

/**
 * Provider wrapper for Angular test modules.
 */
export function provideApplicationConfigServiceMock(
  mock: ApplicationConfigServiceMock = createApplicationConfigServiceMock(),
  provideToken: Type<any> = ApplicationConfigService,
): Provider {
  return { provide: provideToken, useValue: mock };
}

import { Provider } from '@angular/core';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { KeycloakConfig, OtpConfig } from 'app/core/config/application-config.model';

export type ApplicationConfigServiceMock = {
  keycloak: KeycloakConfig;
  otp: OtpConfig;
};

export function createApplicationConfigServiceMock(): ApplicationConfigServiceMock {
  return {
    keycloak: {
      url: 'http://mock-keycloak',
      realm: 'mock-realm',
      clientId: 'mock-client',
    },
    otp: {
      length: 6,
      ttlSeconds: 300,
      resendCooldownSeconds: 60,
    },
  };
}

export function provideApplicationConfigServiceMock(mock: ApplicationConfigServiceMock = createApplicationConfigServiceMock()): Provider {
  return { provide: ApplicationConfigService, useValue: mock };
}

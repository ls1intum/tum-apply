import { Provider, Type } from '@angular/core';
import { ApplicationConfigService } from 'app/core/config/application-config.service';

export type ApplicationConfigServiceMock = {
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
  otp: {
    length: number;
    ttlSeconds: number;
    resendCooldownSeconds: number;
  };
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

export function provideApplicationConfigServiceMock(
  mock: ApplicationConfigServiceMock = createApplicationConfigServiceMock(),
  provideToken: string | Type<any> = 'ApplicationConfigService',
): Provider {
  return { provide: provideToken, useValue: mock };
}

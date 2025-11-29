import { Provider } from '@angular/core';

export type ApplicationConfigServiceMock = {
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
};

export function createApplicationConfigServiceMock(): ApplicationConfigServiceMock {
  return {
    keycloak: {
      url: 'http://mock-keycloak',
      realm: 'mock-realm',
      clientId: 'mock-client',
    },
  };
}

export function provideApplicationConfigServiceMock(mock: ApplicationConfigServiceMock = createApplicationConfigServiceMock()): Provider {
  return { provide: 'ApplicationConfigService', useValue: mock };
}

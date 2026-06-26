import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { provideToastServiceMock } from 'util/toast-service.mock';

describe('ApplicationConfigService', () => {
  let service: ApplicationConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideToastServiceMock()],
    });
    service = TestBed.inject(ApplicationConfigService);
  });

  it('getters throw before initialization', () => {
    expect(() => service.getAppConfig()).toThrow('ApplicationConfig not initialized yet');
    expect(() => service.keycloak).toThrow('ApplicationConfig not initialized yet');
    expect(() => service.otp).toThrow('ApplicationConfig not initialized yet');
  });

  describe('setAppConfig & getAppConfig', () => {
    it('should store a frozen clone and not the original reference', () => {
      const input = {
        keycloak: {
          url: 'http://kc',
          tumLoginRealm: 'tumidpldap',
          clientId: 'client',
          relyingPartyId: 'localhost',
        },
        otp: { length: 3, ttlSeconds: 120, resendCooldownSeconds: 30 },
      };

      service.setAppConfig(input);

      const stored = service.getAppConfig();
      expect(stored).toEqual(input);
      expect(stored).not.toBe(input);
      expect(Object.isFrozen(stored)).toBe(true);

      // Mutating the original input after setAppConfig must not affect the stored config
      input.keycloak.url = 'changed-after-set';
      expect(service.getAppConfig().keycloak?.url).toBe('http://kc');
    });

    it('should override previous config on subsequent calls', () => {
      service.setAppConfig({
        keycloak: { url: 'first', tumLoginRealm: 'tum', clientId: 'c', relyingPartyId: '' },
      });
      service.setAppConfig({
        keycloak: { url: 'second', tumLoginRealm: 'tum', clientId: 'c', relyingPartyId: '' },
      });
      expect(service.getAppConfig().keycloak?.url).toBe('second');
    });
  });

  describe('convenience getters with defaults', () => {
    it('should return same defaults when sub-objects are missing', () => {
      service.setAppConfig({});

      expect(service.keycloak).toEqual({
        url: '',
        tumLoginRealm: '',
        clientId: '',
        relyingPartyId: '',
      });
      expect(service.otp).toEqual({ length: 4, ttlSeconds: 300, resendCooldownSeconds: 60 });
    });

    it('should return provided values when present', () => {
      service.setAppConfig({
        keycloak: {
          url: 'http://kc',
          tumLoginRealm: 'tumidpldap',
          clientId: 'cli',
          relyingPartyId: 'apply.in.tum.de',
        },
        otp: { length: 8, ttlSeconds: 600, resendCooldownSeconds: 120 },
      });

      expect(service.keycloak).toEqual({
        url: 'http://kc',
        tumLoginRealm: 'tumidpldap',
        clientId: 'cli',
        relyingPartyId: 'apply.in.tum.de',
      });
      expect(service.otp).toEqual({ length: 8, ttlSeconds: 600, resendCooldownSeconds: 120 });
    });
  });

  it('mutating getter results must not change stored config', () => {
    service.setAppConfig({
      keycloak: { url: 'A', tumLoginRealm: 'tum', clientId: 'C', relyingPartyId: '' },
      otp: { length: 7, ttlSeconds: 111, resendCooldownSeconds: 22 },
    });

    service.keycloak.url = 'B';
    expect(service.keycloak.url).toBe('A');

    service.otp.length = 9;
    expect(service.otp.length).toBe(7);
  });

  it('getEndpointFor should echo the api path', () => {
    service.setAppConfig({});
    expect(service.getEndpointFor('api')).toBe('api');
    expect(service.getEndpointFor('/api/auth')).toBe('/api/auth');
  });
});

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { provideToastServiceMock } from '../../../util/toast-service.mock';

describe('ApplicationConfigService', () => {
  let service: ApplicationConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideToastServiceMock()],
    });
    service = TestBed.inject(ApplicationConfigService);
  });

  describe('initialization', () => {
    it('getAppConfig should throw before initialization', () => {
      expect(() => service.getAppConfig()).toThrow('ApplicationConfig not initialized yet');
    });

    it('keycloak getter should throw before initialization', () => {
      expect(() => service.keycloak).toThrow('ApplicationConfig not initialized yet');
    });

    it('otp getter should throw before initialization', () => {
      expect(() => service.otp).toThrow('ApplicationConfig not initialized yet');
    });
  });

  describe('setAppConfig & getAppConfig', () => {
    it('should store a frozen clone and not the original reference', () => {
      const input = {
        keycloak: { url: 'http://kc', realm: 'tumapply', clientId: 'client' },
        otp: { length: 4, ttlSeconds: 120, resendCooldownSeconds: 30 },
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
      service.setAppConfig({ keycloak: { url: 'first', realm: 'r', clientId: 'c' } });
      service.setAppConfig({ keycloak: { url: 'second', realm: 'r', clientId: 'c' } });
      expect(service.getAppConfig().keycloak?.url).toBe('second');
    });
  });

  describe('convenience getters with defaults', () => {
    it('should return same defaults when sub-objects are missing', () => {
      service.setAppConfig({});

      expect(service.keycloak).toEqual({ url: '', realm: '', clientId: '' });
      expect(service.otp).toEqual({ length: 6, ttlSeconds: 300, resendCooldownSeconds: 60 });
    });

    it('should return provided values when present', () => {
      service.setAppConfig({
        keycloak: { url: 'http://kc', realm: 'tum', clientId: 'cli' },
        otp: { length: 8, ttlSeconds: 600, resendCooldownSeconds: 120 },
      });

      expect(service.keycloak).toEqual({ url: 'http://kc', realm: 'tum', clientId: 'cli' });
      expect(service.otp).toEqual({ length: 8, ttlSeconds: 600, resendCooldownSeconds: 120 });
    });
  });

  describe('getter results are copies (no internal mutation)', () => {
    it('mutating keycloak getter result must not change stored config', () => {
      service.setAppConfig({ keycloak: { url: 'A', realm: 'R', clientId: 'C' } });
      const k = service.keycloak;
      k.url = 'B';
      expect(service.keycloak.url).toBe('A');
    });

    it('mutating otp getter result must not change stored config', () => {
      service.setAppConfig({ otp: { length: 7, ttlSeconds: 111, resendCooldownSeconds: 22 } });
      const o = service.otp;
      o.length = 9;
      expect(service.otp.length).toBe(7);
    });
  });

  describe('getEndpointFor', () => {
    it('should echo the api path (no prefixing applied yet)', () => {
      service.setAppConfig({});
      expect(service.getEndpointFor('api')).toBe('api');
      expect(service.getEndpointFor('/api/auth')).toBe('/api/auth');
    });
  });
});

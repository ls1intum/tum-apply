import { TestBed } from '@angular/core/testing';
import { ThemeService } from 'app/service/theme.service';
import { PrimeNG } from 'primeng/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ThemeService', () => {
  const expectedPrimeThemeOptions = {
    darkModeSelector: '.tum-apply-dark-mode',
    cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
  };
  const primeThemeSet = vi.fn();
  const primeNGMock = {
    theme: {
      set: primeThemeSet,
    },
  };

  let mediaQueryMatches = false;
  let mediaQueryChangeListener: ((event: { matches: boolean }) => void) | undefined;

  const installMatchMediaMock = (): void => {
    mediaQueryChangeListener = undefined;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: mediaQueryMatches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((type: string, listener: (event: { matches: boolean }) => void) => {
          if (type === 'change') {
            mediaQueryChangeListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  const createService = (): ThemeService => {
    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: PrimeNG, useValue: primeNGMock }],
    });
    return TestBed.inject(ThemeService);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    mediaQueryMatches = false;
    installMatchMediaMock();

    document.documentElement.classList.remove('tum-apply-dark-mode', 'tum-apply-blossom', 'tum-apply-aquabloom', 'theme-switching');
    primeThemeSet.mockClear();
    vi.restoreAllMocks();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    });
  });

  describe('getSystemTheme', () => {
    it('should fall back to light when matchMedia is unavailable', () => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: undefined,
      });
      const service = createService();

      expect(service.getSystemTheme()).toBe('light');
    });

    it('should return dark when system prefers dark', () => {
      mediaQueryMatches = true;
      installMatchMediaMock();
      const service = createService();

      expect(service.getSystemTheme()).toBe('dark');
    });
  });

  describe('initial theme', () => {
    it('should use system theme when sync is enabled', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'true');
      mediaQueryMatches = true;
      installMatchMediaMock();

      const service = createService();

      expect(service.theme()).toBe('dark');
    });

    it('should use stored theme when sync is disabled', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'false');
      localStorage.setItem('tumApplyTheme', 'blossom');

      const service = createService();

      expect(service.theme()).toBe('blossom');
    });

    it('should read the initial theme from root css classes when no valid stored theme exists', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'false');
      localStorage.setItem('tumApplyTheme', 'invalid-theme');
      document.documentElement.classList.add('tum-apply-aquabloom');

      const service = createService();

      expect(service.theme()).toBe('aquabloom');
    });
  });

  describe('setTheme', () => {
    it('should toggle root classes and persist theme by default', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'false');
      const service = createService();

      service.setTheme('dark');

      expect(document.documentElement.classList.contains('tum-apply-dark-mode')).toBe(true);
      expect(document.documentElement.classList.contains('tum-apply-blossom')).toBe(false);
      expect(document.documentElement.classList.contains('tum-apply-aquabloom')).toBe(false);
      expect(localStorage.getItem('tumApplyTheme')).toBe('dark');
      expect(primeThemeSet).toHaveBeenCalledTimes(2);
      expect(primeThemeSet).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ preset: expect.anything(), options: expectedPrimeThemeOptions }),
      );
      expect(primeThemeSet).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ preset: expect.anything(), options: expectedPrimeThemeOptions }),
      );
    });

    it('should not persist when saveToStorage is false', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'false');
      localStorage.setItem('tumApplyTheme', 'dark');
      const service = createService();

      service.setTheme('light', false);

      expect(localStorage.getItem('tumApplyTheme')).toBe('dark');
    });
  });

  describe('setupSystemThemeListener', () => {
    it('should react to system theme changes only while sync is enabled', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'true');
      const service = createService();
      const setThemeSpy = vi.spyOn(service, 'setTheme');

      mediaQueryChangeListener?.({ matches: true });
      expect(setThemeSpy).toHaveBeenCalledWith('dark', false);
      expect(setThemeSpy).toHaveBeenCalledOnce();

      service.syncWithSystem.set(false);
      mediaQueryChangeListener?.({ matches: false });
      expect(setThemeSpy).not.toHaveBeenCalledWith('light', false);
      expect(setThemeSpy).toHaveBeenCalledOnce();
    });
  });

  describe('toggleTheme', () => {
    it('should switch from system sync mode to light and disable sync', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'true');
      const service = createService();
      const setThemeSpy = vi.spyOn(service, 'setTheme');

      service.toggleTheme();

      expect(service.syncWithSystem()).toBe(false);
      expect(localStorage.getItem('tumApplySyncWithSystem')).toBe('false');
      expect(setThemeSpy).toHaveBeenCalledWith('light');
      expect(setThemeSpy).toHaveBeenCalledOnce();
    });

    it('should switch light to dark when sync is disabled', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'false');
      localStorage.setItem('tumApplyTheme', 'light');
      const service = createService();
      const setThemeSpy = vi.spyOn(service, 'setTheme');

      service.toggleTheme();

      expect(setThemeSpy).toHaveBeenCalledWith('dark');
      expect(setThemeSpy).toHaveBeenCalledOnce();
    });

    it('should delegate to setSyncWithSystem when currently dark', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'false');
      localStorage.setItem('tumApplyTheme', 'dark');
      const service = createService();
      const setSyncSpy = vi.spyOn(service, 'setSyncWithSystem');

      service.toggleTheme();

      expect(setSyncSpy).toHaveBeenCalledWith(true);
      expect(setSyncSpy).toHaveBeenCalledOnce();
    });
  });

  describe('setSyncWithSystem', () => {
    it('should remove the stored theme and apply the system theme without persisting when enabled', () => {
      localStorage.setItem('tumApplySyncWithSystem', 'false');
      localStorage.setItem('tumApplyTheme', 'blossom');
      mediaQueryMatches = true;
      installMatchMediaMock();

      const service = createService();
      const setThemeSpy = vi.spyOn(service, 'setTheme');

      service.setSyncWithSystem(true);

      expect(localStorage.getItem('tumApplySyncWithSystem')).toBe('true');
      expect(localStorage.getItem('tumApplyTheme')).toBeNull();
      expect(setThemeSpy).toHaveBeenCalledWith('dark', false);
      expect(setThemeSpy).toHaveBeenCalledOnce();
    });
  });
});

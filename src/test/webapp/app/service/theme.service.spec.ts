import { TestBed } from '@angular/core/testing';
import { ThemeService } from 'app/service/theme.service';
import { PrimeNG } from 'primeng/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ThemeService', () => {
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

  it('falls back to light in getSystemTheme when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    const service = createService();

    expect(service.getSystemTheme()).toBe('light');
  });

  it('returns dark in getSystemTheme when system prefers dark', () => {
    mediaQueryMatches = true;
    installMatchMediaMock();
    const service = createService();

    expect(service.getSystemTheme()).toBe('dark');
  });

  it('uses system theme as initial theme when sync is enabled', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'true');
    mediaQueryMatches = true;
    installMatchMediaMock();

    const service = createService();

    expect(service.theme()).toBe('dark');
  });

  it('uses stored theme when sync is disabled', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'false');
    localStorage.setItem('tumApplyTheme', 'blossom');

    const service = createService();

    expect(service.theme()).toBe('blossom');
  });

  it('reads initial theme from root css classes when no valid stored theme exists', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'false');
    localStorage.setItem('tumApplyTheme', 'invalid-theme');
    document.documentElement.classList.add('tum-apply-aquabloom');

    const service = createService();

    expect(service.theme()).toBe('aquabloom');
  });

  it('setTheme toggles root classes and persists theme by default', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'false');
    const service = createService();

    service.setTheme('dark');

    expect(document.documentElement.classList.contains('tum-apply-dark-mode')).toBe(true);
    expect(document.documentElement.classList.contains('tum-apply-blossom')).toBe(false);
    expect(document.documentElement.classList.contains('tum-apply-aquabloom')).toBe(false);
    expect(localStorage.getItem('tumApplyTheme')).toBe('dark');
    expect(primeThemeSet).toHaveBeenCalled();
  });

  it('setTheme does not persist when saveToStorage is false', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'false');
    localStorage.setItem('tumApplyTheme', 'dark');
    const service = createService();

    service.setTheme('light', false);

    expect(localStorage.getItem('tumApplyTheme')).toBe('dark');
  });

  it('setupSystemThemeListener reacts to system theme changes only while sync is enabled', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'true');
    const service = createService();
    const setThemeSpy = vi.spyOn(service, 'setTheme');

    mediaQueryChangeListener?.({ matches: true });
    expect(setThemeSpy).toHaveBeenCalledWith('dark', false);

    service.syncWithSystem.set(false);
    mediaQueryChangeListener?.({ matches: false });
    expect(setThemeSpy).not.toHaveBeenCalledWith('light', false);
  });

  it('toggleTheme switches from system sync mode to light and disables sync', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'true');
    const service = createService();
    const setThemeSpy = vi.spyOn(service, 'setTheme');

    service.toggleTheme();

    expect(service.syncWithSystem()).toBe(false);
    expect(localStorage.getItem('tumApplySyncWithSystem')).toBe('false');
    expect(setThemeSpy).toHaveBeenCalledWith('light');
  });

  it('toggleTheme switches light to dark when sync is disabled', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'false');
    localStorage.setItem('tumApplyTheme', 'light');
    const service = createService();
    const setThemeSpy = vi.spyOn(service, 'setTheme');

    service.toggleTheme();

    expect(setThemeSpy).toHaveBeenCalledWith('dark');
  });

  it('toggleTheme delegates to setSyncWithSystem when currently dark', () => {
    localStorage.setItem('tumApplySyncWithSystem', 'false');
    localStorage.setItem('tumApplyTheme', 'dark');
    const service = createService();
    const setSyncSpy = vi.spyOn(service, 'setSyncWithSystem');

    service.toggleTheme();

    expect(setSyncSpy).toHaveBeenCalledWith(true);
  });

  it('setSyncWithSystem(true) removes stored theme and applies system theme without persisting', () => {
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
  });
});

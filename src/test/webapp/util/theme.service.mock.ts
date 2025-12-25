import { Provider, signal, WritableSignal } from '@angular/core';
import { vi } from 'vitest';
import { ThemeOption, ThemeService } from 'app/service/theme.service';

export type ThemeServiceMock = Pick<ThemeService, 'theme' | 'syncWithSystem' | 'setTheme' | 'toggleTheme' | 'setSyncWithSystem'>;

export function createThemeServiceMock(initialTheme: ThemeOption = 'light', initialSyncWithSystem = false): ThemeServiceMock {
  const theme: WritableSignal<ThemeOption> = signal(initialTheme);
  const syncWithSystem: WritableSignal<boolean> = signal(initialSyncWithSystem);

  return {
    theme,
    syncWithSystem,
    setTheme: vi.fn((newTheme: ThemeOption) => {
      theme.set(newTheme);
    }),
    toggleTheme: vi.fn(() => {
      const newTheme = theme() === 'dark' ? 'light' : 'dark';
      theme.set(newTheme);
      syncWithSystem.set(false);
    }),
    setSyncWithSystem: vi.fn((value: boolean) => {
      syncWithSystem.set(value);
    }),
  };
}

export function provideThemeServiceMock(mock: ThemeServiceMock = createThemeServiceMock()): Provider {
  return { provide: ThemeService, useValue: mock };
}

/**
 * Sets up window.matchMedia mock for tests.
 * Call this in beforeEach or beforeAll when testing components that use ThemeService.
 */
export function setupWindowMatchMediaMock(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { PrimeNG } from 'primeng/config';

import { AquaBloomTheme } from '../../content/theming/aquabloom';
import { BlossomTheme } from '../../content/theming/custompreset';
import { TUMApplyPreset } from '../../content/theming/tumapplypreset';

export type ThemeOption = 'light' | 'dark' | 'blossom' | 'aquabloom';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  theme: WritableSignal<ThemeOption> = signal(this.getInitialTheme());
  syncWithSystem: WritableSignal<boolean> = signal(this.getInitialSyncWithSystem());

  private primeNG = inject(PrimeNG);
  private readonly rootElement = document.documentElement;

  constructor() {
    const shouldSave = !this.syncWithSystem();
    this.setTheme(this.theme(), shouldSave);
    this.setupSystemThemeListener();
  }

  getInitialTheme(): ThemeOption {
    const storedSync = localStorage.getItem('tumApplySyncWithSystem');
    const syncWithSystem = storedSync === null ? true : storedSync === 'true';

    if (syncWithSystem) {
      return this.getSystemTheme();
    }

    const stored = localStorage.getItem('tumApplyTheme') as ThemeOption | null;

    if (stored === 'dark' || stored === 'blossom' || stored === 'light' || stored === 'aquabloom') {
      return stored;
    }
    const classList = document.documentElement.classList;
    if (classList.contains('tum-apply-blossom')) {
      return 'blossom';
    }
    if (classList.contains('tum-apply-dark-mode')) {
      return 'dark';
    }
    if (classList.contains('tum-apply-aquabloom')) {
      return 'aquabloom';
    }
    return 'light';
  }

  getInitialSyncWithSystem(): boolean {
    const stored = localStorage.getItem('tumApplySyncWithSystem');
    return stored === null ? true : stored === 'true';
  }

  getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setupSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', e => {
      if (this.syncWithSystem()) {
        // Don't save to localStorage when syncing with system
        this.setTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }

  setTheme(theme: ThemeOption, saveToStorage = true): void {
    this.theme.set(theme);

    const root = this.rootElement;

    // Disable transitions/animations before changing theme
    root.classList.add('theme-switching');

    root.classList.remove('tum-apply-dark-mode', 'tum-apply-blossom', 'tum-apply-aquabloom');

    const themeOptions = {
      darkModeSelector: '.tum-apply-dark-mode',
      cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
    };

    if (theme === 'blossom') {
      this.primeNG.theme.set({ preset: BlossomTheme, options: themeOptions });
      root.classList.add('tum-apply-blossom');
    } else if (theme === 'aquabloom') {
      this.primeNG.theme.set({ preset: AquaBloomTheme, options: themeOptions });
      root.classList.add('tum-apply-aquabloom');
    } else {
      this.primeNG.theme.set({ preset: TUMApplyPreset, options: themeOptions });
      if (theme === 'dark') {
        root.classList.add('tum-apply-dark-mode');
      }
    }

    if (saveToStorage) {
      localStorage.setItem('tumApplyTheme', theme);
    }

    // allow one frame for styles to apply, then restore transitions
    window.requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
  }

  toggleTheme(): void {
    if (this.syncWithSystem()) {
      // Currently on system, switch to light
      this.syncWithSystem.set(false);
      localStorage.setItem('tumApplySyncWithSystem', 'false');
      this.setTheme('light');
    } else if (this.theme() === 'light') {
      // Currently on light, switch to dark
      this.setTheme('dark');
    } else {
      // Currently on dark, switch back to system
      this.setSyncWithSystem(true);
    }
  }

  setSyncWithSystem(value: boolean): void {
    this.syncWithSystem.set(value);
    localStorage.setItem('tumApplySyncWithSystem', String(value));

    if (value) {
      // When enabling system sync, remove the stored theme and don't save to localStorage
      localStorage.removeItem('tumApplyTheme');
      const systemTheme = this.getSystemTheme();
      this.setTheme(systemTheme, false);
    }
  }
}

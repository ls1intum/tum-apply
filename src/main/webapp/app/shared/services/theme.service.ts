import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { PrimeNG } from 'primeng/config';

import { AquaBloomTheme } from '../../../content/theming/aquabloom';
import { BlossomTheme } from '../../../content/theming/custompreset';
import { TUMApplyPreset } from '../../../content/theming/tumapplypreset';

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
    this.setTheme(this.theme());
    this.setupSystemThemeListener();
  }

  getInitialTheme(): ThemeOption {
    const syncWithSystem = localStorage.getItem('tumApplySyncWithSystem') === 'true';

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
    return localStorage.getItem('tumApplySyncWithSystem') === 'true';
  }

  getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setupSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', e => {
      if (this.syncWithSystem()) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme: ThemeOption): void {
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

    localStorage.setItem('tumApplyTheme', theme);

    // allow one frame for styles to apply, then restore transitions
    window.requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
  }

  toggleTheme(): void {
    const newTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.syncWithSystem.set(false);
    localStorage.setItem('tumApplySyncWithSystem', 'false');
    this.setTheme(newTheme);
  }

  setSyncWithSystem(value: boolean): void {
    this.syncWithSystem.set(value);
    localStorage.setItem('tumApplySyncWithSystem', String(value));

    if (value) {
      const systemTheme = this.getSystemTheme();
      this.setTheme(systemTheme);
    }
  }
}

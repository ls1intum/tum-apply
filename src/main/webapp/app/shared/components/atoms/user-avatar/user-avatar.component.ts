import { Component, computed, inject, input } from '@angular/core';
import { ThemeService } from 'app/service/theme.service';

@Component({
  selector: 'jhi-user-avatar',
  standalone: true,
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
})
export class UserAvatarComponent {
  firstName = input<string | undefined>(undefined);
  lastName = input<string | undefined>(undefined);
  fullName = input<string | undefined>(undefined);
  colorKey = input<string | undefined>(undefined);
  size = input<'sm' | 'md' | 'lg'>('md');

  initials = computed(() => {
    const first = this.firstName()?.trim();
    const last = this.lastName()?.trim();
    const fromNames = this.initialsFromNameParts(first, last);
    if (fromNames !== undefined) {
      return fromNames;
    }
    return this.initialsFromFullName(this.fullName()?.trim() ?? '');
  });

  ariaLabel = computed(() => {
    const fullName = this.fullName()?.trim();
    const combined = `${this.firstName() ?? ''} ${this.lastName() ?? ''}`.trim();
    const label = fullName && fullName !== '' ? fullName : combined;
    return label === '' ? 'User avatar' : `Avatar of ${label}`;
  });

  backgroundColor = computed(() => {
    const source = this.firstNonEmpty(
      this.colorKey()?.trim(),
      this.fullName()?.trim(),
      `${this.firstName() ?? ''} ${this.lastName() ?? ''}`.trim(),
      'U',
    );
    const hash = this.hashString(source);
    const palette = this.themeService.theme() === 'dark' ? this.darkAvatarPalette : this.lightAvatarPalette;
    return palette[Math.abs(hash) % palette.length];
  });

  textColor = computed(() => this.darkenHex(this.backgroundColor(), this.themeService.theme() === 'dark' ? 0.4 : 0.5));
  borderColor = computed(() => this.withAlpha(this.textColor(), 0.45));
  textShadow = computed(() => (this.themeService.theme() === 'dark' ? '0 1px 0 rgba(0, 0, 0, 0.25)' : '0 1px 0 rgba(255, 255, 255, 0.28)'));

  private readonly lightAvatarPalette = ['#B5D0FA', '#BFECD7', '#FFE6A8', '#FFCACA', '#E0CFFA', '#BDEDEA', '#FCD3BE', '#F5CAE0'];
  private readonly darkAvatarPalette = ['#8EAAD5', '#8BC2AD', '#DCC684', '#D98EA2', '#A898DA', '#87C2BF', '#B8848E', '#D59BB7'];
  private readonly themeService = inject(ThemeService);

  private hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) % Number.MAX_SAFE_INTEGER;
    }
    return Math.floor(hash);
  }

  private initialsFromNameParts(first: string | undefined, last: string | undefined): string | undefined {
    const firstInitial = first?.charAt(0) ?? '';
    const lastInitial = last?.charAt(0) ?? '';
    const direct = `${firstInitial}${lastInitial}`.toUpperCase();
    return direct !== '' ? direct : undefined;
  }

  private initialsFromFullName(name: string): string {
    if (name === '') {
      return 'U';
    }

    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }

  private firstNonEmpty(...values: (string | undefined)[]): string {
    for (const value of values) {
      if (value !== undefined && value !== '') {
        return value;
      }
    }
    return 'U';
  }

  private darkenHex(hex: string, factor: number): string {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) {
      return '#1f2937';
    }

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);

    const darkenedR = Math.max(0, Math.min(255, Math.round(r * factor)));
    const darkenedG = Math.max(0, Math.min(255, Math.round(g * factor)));
    const darkenedB = Math.max(0, Math.min(255, Math.round(b * factor)));

    return `rgb(${darkenedR}, ${darkenedG}, ${darkenedB})`;
  }

  private withAlpha(rgb: string, alpha: number): string {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) {
      return rgb;
    }

    const [, r, g, b] = match;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

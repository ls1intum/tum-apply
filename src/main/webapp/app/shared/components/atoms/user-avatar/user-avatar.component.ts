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

  private readonly lightAvatarPalette = [
    '#BFD7FF',
    '#C8F1DD',
    '#FFE2B8',
    '#FFD0D0',
    '#E7D6FF',
    '#C6F1EE',
    '#FFDCC8',
    '#F9D2E5',
  ];
  private readonly darkAvatarPalette = [
    '#9FB6E8',
    '#9FD6BE',
    '#E4C19C',
    '#E5AFAF',
    '#C4B0E8',
    '#96D0CC',
    '#E6C0A6',
    '#DEB0C8',
  ];
  private readonly themeService = inject(ThemeService);

  initials = computed(() => {
    const first = this.firstName()?.trim();
    const last = this.lastName()?.trim();

    if (first || last) {
      const firstInitial = first?.charAt(0) ?? '';
      const lastInitial = last?.charAt(0) ?? '';
      const direct = `${firstInitial}${lastInitial}`.toUpperCase();
      if (direct !== '') {
        return direct;
      }
    }

    const name = this.fullName()?.trim() ?? '';
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
  });

  ariaLabel = computed(() => {
    const fullName = this.fullName()?.trim();
    const combined = `${this.firstName() ?? ''} ${this.lastName() ?? ''}`.trim();
    const label = fullName && fullName !== '' ? fullName : combined;
    return label === '' ? 'User avatar' : `Avatar of ${label}`;
  });

  backgroundColor = computed(() => {
    const source = this.colorKey()?.trim() || this.fullName()?.trim() || `${this.firstName() ?? ''} ${this.lastName() ?? ''}`.trim() || 'U';
    const hash = this.hashString(source);
    const palette = this.themeService.theme() === 'dark' ? this.darkAvatarPalette : this.lightAvatarPalette;
    return palette[Math.abs(hash) % palette.length];
  });

  textColor = computed(() => this.darkenHex(this.backgroundColor(), this.themeService.theme() === 'dark' ? 0.4 : 0.55));
  borderColor = computed(() => this.withAlpha(this.textColor(), 0.45));
  textShadow = computed(() =>
    this.themeService.theme() === 'dark' ? '0 1px 0 rgba(0, 0, 0, 0.25)' : '0 1px 0 rgba(255, 255, 255, 0.28)',
  );

  private hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return hash;
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

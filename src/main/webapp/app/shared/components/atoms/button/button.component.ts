import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, ViewEncapsulation, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { TranslateDirective } from 'app/shared/language';
import { ButtonModule } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { TooltipModule } from 'primeng/tooltip';

export type ButtonColor = 'primary' | 'secondary' | 'contrast' | 'success' | 'warn' | 'danger' | 'info';

export type ButtonVariant = 'outlined' | 'text';

export type Button = {
  severity: ButtonColor;
  variant?: ButtonVariant;
  icon?: string;
  isExternalLink?: boolean;
  label?: string;
  numberOfFavorites?: number;
  disabled: boolean;
  fullWidth?: boolean;
  onClick: VoidFunction;
  shouldTranslate?: boolean;
};

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'jhi-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  standalone: true,
  imports: [CommonModule, ButtonModule, FontAwesomeModule, OverlayBadgeModule, NgTemplateOutlet, TooltipModule, TranslateDirective],
  encapsulation: ViewEncapsulation.None,
})
export class ButtonComponent {
  severity = input<ButtonColor>('primary');
  variant = input<ButtonVariant>();
  icon = input<string | undefined>(undefined);
  isExternalLink = input<boolean | undefined>(false);
  label = input<string | undefined>(undefined);
  numberOfFavorites = input<number | undefined>(undefined);
  disabled = input<boolean>(false);
  shouldTranslate = input<boolean>(false);
  fullWidth = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  loading = input<boolean>(false);
  autofocus = input<boolean>(false);
  size = input<ButtonSize>('lg');
  tooltip = input<string | undefined>(undefined);
  tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');

  readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  styleClass = input<string>('');

  iconPrefix(): 'fas' | 'fab' {
    if (this.icon() === 'microsoft' || this.icon() === 'google' || this.icon() === 'apple') {
      return 'fab';
    }
    return 'fas';
  }

  buttonClass(): string {
    let sizeClass = '';
    if (this.label() === undefined) {
      sizeClass = `rounded-md ${this.size() === 'sm' ? 'rounded-full w-10 h-10 scale-85' : this.size() === 'md' ? 'w-10 h-10' : 'w-12 h-12'}`;
    }

    if (this.size() === 'xs') {
      sizeClass += ' !py-0 !px-2 !text-xs !h-8';
    }

    return `${sizeClass} ${this.fullWidth() ? 'flex-1 w-full' : ''} ${this.styleClass()}`;
  }
}

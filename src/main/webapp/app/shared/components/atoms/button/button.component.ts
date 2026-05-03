import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';
import { TooltipOptions } from 'primeng/api';
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
  shouldTranslate = input<boolean>(true);
  fullWidth = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  loading = input<boolean>(false);
  autofocus = input<boolean>(false);
  size = input<ButtonSize>('lg');
  tooltip = input<string | undefined>(undefined);
  tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');
  tooltipOptions = input<TooltipOptions>();

  readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  classStyling = input<string>('');

  displayTooltip = computed(() => this.translate(this.tooltip()));
  ariaLabel = computed(() => (this.label() === undefined ? this.displayTooltip() : undefined));

  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

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

    return `${sizeClass} ${this.fullWidth() ? 'flex-1 w-full' : ''} ${this.classStyling()}`;
  }

  private translate(value: string | undefined): string | undefined {
    this.langChange();
    if (value === undefined) {
      return undefined;
    }
    return this.shouldTranslate() ? this.translateService.instant(value) : value;
  }
}

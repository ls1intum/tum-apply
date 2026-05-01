import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

export type InfoIconSize = 'sm' | 'md';

@Component({
  selector: 'jhi-info-icon',
  standalone: true,
  imports: [NgTemplateOutlet, TooltipModule, TranslateModule],
  templateUrl: './info-icon.component.html',
})
export class InfoIconComponent {
  tooltip = input<string | undefined>(undefined);
  tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');
  ariaLabel = input<string>('More information');
  size = input<InfoIconSize>('md');
  clickable = input<boolean>(false);
  disabled = input<boolean>(false);
  shouldTranslate = input<boolean>(false);

  clicked = output();

  iconSizeClass = computed(() => (this.size() === 'sm' ? 'text-base' : 'text-xl'));
  paddingClass = computed(() => 'p-0');

  onClick(event: Event): void {
    if (this.disabled()) {
      return;
    }
    event.stopPropagation();
    this.clicked.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.clicked.emit();
    }
  }
}

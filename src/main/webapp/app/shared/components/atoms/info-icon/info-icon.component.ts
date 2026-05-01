import { Component, computed, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';

export type InfoIconSize = 'sm' | 'md';

@Component({
  selector: 'jhi-info-icon',
  standalone: true,
  imports: [FontAwesomeModule, TooltipModule],
  templateUrl: './info-icon.component.html',
})
export class InfoIconComponent {
  tooltip = input<string | undefined>(undefined);
  tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');
  ariaLabel = input<string>('More information');
  size = input<InfoIconSize>('md');
  clickable = input<boolean>(false);

  clicked = output();

  iconSizeClass = computed(() => (this.size() === 'sm' ? 'text-sm' : 'text-base'));

  onClick(event: Event): void {
    event.stopPropagation();
    this.clicked.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.clicked.emit();
    }
  }
}

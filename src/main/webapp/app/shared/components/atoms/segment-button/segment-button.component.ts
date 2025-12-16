import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-segment-button',
  templateUrl: './segment-button.component.html',
  standalone: true,
  imports: [CommonModule, TranslateModule],
})
export class SegmentButtonComponent {
  label = input.required<string>();
  active = input<boolean>(false);
  disabled = input<boolean>(false);
  shouldTranslate = input<boolean>(false);

  readonly buttonClick = output();

  readonly buttonClass = computed(() => {
    const base = 'w-full rounded-md border-none shadow-none transition-all px-3 py-1.5 text-xs cursor-pointer';
    const activeStyle = 'bg-primary-default text-text-on-primary font-semibold';
    const inactiveStyle = 'bg-transparent text-text-secondary hover:bg-primary-default hover:text-text-on-primary';
    const disabledStyle = 'opacity-50 cursor-not-allowed';

    let style = `${base} ${this.active() ? activeStyle : inactiveStyle}`;
    if (this.disabled()) {
      style += ` ${disabledStyle}`;
    }
    return style;
  });

  onClick(): void {
    if (!this.disabled()) {
      this.buttonClick.emit();
    }
  }
}

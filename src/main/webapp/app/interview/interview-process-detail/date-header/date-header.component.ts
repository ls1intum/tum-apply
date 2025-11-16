import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'jhi-date-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col">
      <span class="text-xs font-semibold text-[var(--text-color-secondary)] uppercase">
        {{ weekday() }}
      </span>
      <span class="text-2xl font-bold text-[var(--text-color)]">
        {{ day() }}
      </span>
    </div>
  `,
})
export class DateHeaderComponent {
  date = input.required<Date>();

  weekday = () => {
    return this.date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  day = () => {
    return this.date().toLocaleDateString('en-US', { day: '2-digit' });
  };
}

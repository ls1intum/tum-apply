import { Component, ViewEncapsulation, effect, input, output, signal } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'jhi-datepicker',
  standalone: true,
  imports: [CommonModule, DatePickerModule, FormsModule, FontAwesomeModule],
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DatePickerComponent {
  isCalendarOpen = false;

  width = input<string>('100%');
  label = input<string>('Date');
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  placeholder = input<string>('Select a date...');

  /**
   * Input date value in ISO format: 'YYYY-MM-DD'
   */
  selectedDate = input<string | undefined>(undefined);

  /**
   * Emits ISO date string ('YYYY-MM-DD') when user selects a date
   */
  selectedDateChange = output<string | undefined>();

  /**
   * Internally used model bound to the PrimeNG datepicker
   * Converts `selectedDate` (string) into `Date` object.
   *
   * Must be a signal to reactively update the input when form state changes.
   */
  modelDate = signal<Date | undefined>(undefined);

  constructor() {
    // Sync modelDate whenever selectedDate changes
    effect(() => {
      const value = this.selectedDate();
      if (value) {
        const [year, month, day] = value.split('-').map(Number);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          this.modelDate.set(new Date(year, month - 1, day));
        } else {
          this.modelDate.set(undefined);
        }
      } else {
        this.modelDate.set(undefined);
      }
    });
  }

  /**
   * Converts a Date object to ISO date string and emits it as `selectedDateChange`.
   * @param date - The Date object selected by the user
   */
  onDateChange(date: Date | undefined): void {
    if (date) {
      const year = date.getFullYear().toString().padStart(4, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      this.selectedDateChange.emit(localDate);
    } else {
      this.selectedDateChange.emit(undefined);
    }
  }
}

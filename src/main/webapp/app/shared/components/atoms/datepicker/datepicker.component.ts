import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

@Component({
  selector: 'jhi-datepicker',
  standalone: true,
  imports: [DatePickerModule, FormsModule, FontAwesomeModule],
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DatePickerComponent {
  isCalendarOpen = false;
  readonly faCalendar = faCalendar;

  width = input<string>('50%');
  label = input<string>('Date');
  placeholder = input<string>('Select a date...');
  selectedDate = input<LocalDate | null>(null);
  selectedDateChange = output<LocalDate | null>();

  modelDate: Date | null = null;

  onDateChange(date: Date | null): void {
    if (date) {
      const localDate: LocalDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
      this.selectedDateChange.emit(localDate);
    } else {
      this.selectedDateChange.emit(null);
    }
  }
}

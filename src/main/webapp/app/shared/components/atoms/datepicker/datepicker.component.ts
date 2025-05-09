import { Component, EventEmitter, Input, Output } from '@angular/core';
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
})
export class DatePickerComponent {
  isCalendarOpen = false;
  readonly faCalendar = faCalendar;

  @Input() label = 'Date';
  @Input() placeholder = 'Select a date...';
  @Input() selectedDate: LocalDate | null = null;
  @Output() selectedDateChange = new EventEmitter<LocalDate | null>();

  modelDate: Date | null = null;

  onDateChange(date: Date | null): void {
    if (date) {
      const localDate: LocalDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
      this.selectedDate = localDate;
      this.selectedDateChange.emit(localDate);
    } else {
      this.selectedDate = null;
      this.selectedDateChange.emit(null);
    }
  }
}

// Testing the DatePickerComponent

// import {Component} from '@angular/core';
// import {DatePickerModule} from 'primeng/datepicker';
// import {FormsModule} from '@angular/forms';
// import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
// import {faCalendar} from '@fortawesome/free-solid-svg-icons';

// @Component({
//     selector: 'jhi-datepicker',
//     standalone: true,
//     imports: [DatePickerModule, FormsModule, FontAwesomeModule],
//     templateUrl: './datepicker.component.html',
//     styleUrls: ['./datepicker.component.scss'],
// })
// export class DatePickerComponent {
//     readonly faCalendar = faCalendar;
//     selectedDate: Date | null = null;
// fa: any;
// solid: any;
// }

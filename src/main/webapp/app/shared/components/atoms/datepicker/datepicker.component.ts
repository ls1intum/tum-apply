import { Component } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';

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
  selectedDate: Date | null = null;
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

/*import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'jhi-datepicker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
})
export class DatePickerComponent {
  selectedDate: string = '';
}*/

import { Component } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'jhi-datepicker',
  standalone: true,
  imports: [DatePickerModule, FormsModule],
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
})
export class DatePickerComponent {
  selectedDate: Date | null = null;
}

// import {Component} from '@angular/core';
// import {FormsModule} from '@angular/forms';
// import {CalendarModule} from 'primeng/calendar';
// import {CommonModule} from '@angular/common';

// @Component({
//   selector: 'jhi-datepicker',
//   standalone: true,
//   imports: [FormsModule, CalendarModule, CommonModule],
//   templateUrl: './datepicker.component.html',
//   styleUrls: ['./datepicker.component.scss'],
// })
// export class DatePickerComponent {
//   selectedDate: Date | null = null;
// }

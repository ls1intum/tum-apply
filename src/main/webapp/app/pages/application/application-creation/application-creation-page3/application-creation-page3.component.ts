import { CommonModule } from '@angular/common';
import { Component, model } from '@angular/core';
import { DividerComponent } from 'app/shared/components/atoms/divider/divider.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { DatePickerComponent, LocalDate } from '../../../../shared/components/atoms/datepicker/datepicker.component';

export type ApplicationCreationPage3Data = {
  desiredStartDate: LocalDate;
  // TODO cv
  // TODO references
  motivation: string;
  skills: string;
  experiences: string;
};

@Component({
  selector: 'jhi-application-creation-page3',
  imports: [CommonModule, StringInputComponent, DividerComponent, DatePickerComponent],
  templateUrl: './application-creation-page3.component.html',
  styleUrl: './application-creation-page3.component.scss',
})
export default class ApplicationCreationPage3Component {
  data = model.required<ApplicationCreationPage3Data>();
}

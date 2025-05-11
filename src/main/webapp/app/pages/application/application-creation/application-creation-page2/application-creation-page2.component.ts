import { CommonModule } from '@angular/common';
import { Component, model } from '@angular/core';
import { DividerComponent } from 'app/shared/components/atoms/divider/divider.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';

export type ApplicationCreationPage2Data = {
  bachelorsDegreeName: string;
  bachelorsDegreeUniversity: string;
  bachelorsGradingScale: string;
  bachelorsGrade: string;
  mastersDegreeName: string;
  mastersDegreeUniversity: string;
  mastersGradingScale: string;
  mastersGrade: string;
  // TODO Fileupload
};

@Component({
  selector: 'jhi-application-creation-page2',
  imports: [CommonModule, StringInputComponent, DividerComponent],
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
})
export default class ApplicationCreationPage2Component {
  data = model.required<ApplicationCreationPage2Data>();
}

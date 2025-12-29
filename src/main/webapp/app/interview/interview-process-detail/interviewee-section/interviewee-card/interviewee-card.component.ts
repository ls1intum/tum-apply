import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';

@Component({
  selector: 'jhi-interviewee-card',
  standalone: true,
  imports: [TranslateModule, TranslateDirective, ButtonComponent],
  templateUrl: './interviewee-card.component.html',
})
export class IntervieweeCardComponent {
  interviewee = input.required<IntervieweeDTO>();

  protected readonly IntervieweeState = {
    UNCONTACTED: 'UNCONTACTED',
    INVITED: 'INVITED',
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
  } as const;
}

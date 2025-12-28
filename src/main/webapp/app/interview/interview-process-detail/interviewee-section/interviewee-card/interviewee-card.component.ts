import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';

@Component({
  selector: 'jhi-interviewee-card',
  standalone: true,
  imports: [TranslateModule, TranslateDirective, ButtonComponent, FontAwesomeModule],
  templateUrl: './interviewee-card.component.html',
})
export class IntervieweeCardComponent {
  // Inputs
  interviewee = input.required<IntervieweeDTO>();
  processId = input.required<string>();

  // Constants
  protected readonly IntervieweeState = {
    UNCONTACTED: 'UNCONTACTED',
    INVITED: 'INVITED',
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
  } as const;

  // Injected Services
  private readonly router = inject(Router);

  // Navigate to assessment page
  navigateToAssessment(): void {
    void this.router.navigate(['/interviews', 'process', this.processId(), 'interviewee', this.interviewee().id, 'assessment']);
  }
}

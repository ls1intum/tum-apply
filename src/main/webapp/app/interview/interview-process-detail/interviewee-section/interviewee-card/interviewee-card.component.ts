import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { formatDate, formatTimeRange, getLocale } from 'app/shared/util/date-time.util';

/**
 * Card component displaying an interviewee's status and scheduled slot details.
 * Shows different UI based on state: UNCONTACTED, INVITED, SCHEDULED, COMPLETED.
 */
@Component({
  selector: 'jhi-interviewee-card',
  standalone: true,
  imports: [TranslateModule, TranslateDirective, ButtonComponent, FontAwesomeModule, UserAvatarComponent],
  templateUrl: './interviewee-card.component.html',
})
export class IntervieweeCardComponent {
  // Inputs
  interviewee = input.required<IntervieweeDTO>();
  processId = input.required<string>();
  sending = input<boolean>(false);

  // Outputs
  sendInvitation = output<IntervieweeDTO>();

  // Computed values
  scheduledDate = computed(() => {
    const slot = this.interviewee().scheduledSlot;
    return slot ? formatDate(slot.startDateTime, this.locale()) : '';
  });

  timeRange = computed(() => {
    const slot = this.interviewee().scheduledSlot;
    return slot ? formatTimeRange(slot.startDateTime, slot.endDateTime, this.locale()) : '';
  });

  location = computed(() => this.interviewee().scheduledSlot?.location ?? '');
  isVirtual = computed(() => this.interviewee().scheduledSlot?.location === 'virtual');

  // Constants
  protected readonly IntervieweeState = {
    UNCONTACTED: 'UNCONTACTED',
    INVITED: 'INVITED',
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
  } as const;

  // Services
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);
  private locale = computed(() => getLocale(this.translateService));

  // Methods
  navigateToAssessment(): void {
    void this.router.navigate(['/interviews', 'process', this.processId(), 'interviewee', this.interviewee().id, 'assessment']);
  }
}

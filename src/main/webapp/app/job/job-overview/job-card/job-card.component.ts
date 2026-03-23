import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { JobCardDTO } from 'app/generated/model/jobCardDTO';
import LocalizedDatePipe from 'app/shared/pipes/localized-date.pipe';
import { TranslateDirective } from 'app/shared/language';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';

import * as DropDownOptions from '../../dropdown-options';
export type ApplicationStatusExtended = JobCardDTO.ApplicationStateEnum | 'NOT_YET_APPLIED';

export const ApplicationStatusExtended = {
  ...JobCardDTO.ApplicationStateEnum,
  NotYetApplied: 'NOT_YET_APPLIED' as ApplicationStatusExtended,
};

@Component({
  selector: 'jhi-job-card',
  templateUrl: './job-card.component.html',
  imports: [FontAwesomeModule, CardModule, TooltipModule, TranslateModule, TranslateDirective, LocalizedDatePipe, UserAvatarComponent],
})
export class JobCardComponent {
  jobId = input<string>('');
  jobTitle = input<string>('');
  subjectArea = input<JobCardDTO.SubjectAreaEnum>();
  researchArea = input<string>('');
  location = input<string>('');
  professor = input<string>('');
  avatarUrl = input<string | undefined>(undefined);
  workload = input<number | undefined>(undefined);
  startDate = input<string | undefined>('');
  relativeTime = input<string>('');
  applicationId = input<string | undefined>(undefined);
  contractDuration = input<number | undefined>(undefined);
  showSubscriptionBell = input(false);
  isSubjectAreaSubscribed = input(false);

  applicationState = input<ApplicationStatusExtended>(ApplicationStatusExtended.NotYetApplied);
  subjectAreaNotificationClick = output<JobCardDTO.SubjectAreaEnum>();

  // Optional header background image
  headerImageUrl = input<string | undefined>(undefined);
  // TO-DO: Replace value of icon with an icon corresponding to the field of study
  icon = input<string>('flask-vial');
  readonly dropDownOptions = DropDownOptions;
  translate = inject(TranslateService);

  currentLang = toSignal(this.translate.onLangChange);

  readonly formattedWorkload = computed(() => {
    const workloadValue = this.workload();
    if (workloadValue === undefined) {
      return undefined;
    }
    void this.currentLang();
    if (workloadValue === 40) {
      return this.translate.instant('jobDetailPage.workload.fullTime');
    }
    const percentage = Math.round((workloadValue / 40) * 100);
    return this.translate.instant('jobDetailPage.workload.partTime', { percentage });
  });

  readonly formattedContractDuration = computed(() => {
    const duration = this.contractDuration();
    if (duration === undefined) {
      return undefined;
    }
    return duration;
  });

  readonly subscriptionTooltipKey = computed(() => {
    return this.subjectAreaNotificationTooltipKey(this.subjectArea());
  });

  ApplicationStateEnumLocal = JobCardDTO.ApplicationStateEnum;

  private router = inject(Router);

  onViewDetails(): void {
    void this.router.navigate([`/job/detail/${this.jobId()}`]);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onViewDetails();
    }
  }

  onSubscriptionBellClick(event: Event): void {
    // We don't want the click on the subscription bell to trigger the card's click event, which would navigate to the job details page.
    // Therefore, we stop the propagation of the click event.
    event.stopPropagation();

    const subjectArea = this.subjectArea();
    if (subjectArea) {
      this.subjectAreaNotificationClick.emit(subjectArea);
    }
  }

  subjectAreaNotificationTooltipKey(subjectArea: JobCardDTO.SubjectAreaEnum | undefined): string {
    if (!subjectArea) {
      return 'jobOverviewPage.tooltips.subscribeToSubjectArea';
    }

    return this.isSubjectAreaSubscribed()
      ? 'jobOverviewPage.tooltips.subjectAreaSubscribed'
      : 'jobOverviewPage.tooltips.subscribeToSubjectArea';
  }

  subjectAreaNotificationAriaLabelKey(subjectArea: JobCardDTO.SubjectAreaEnum | undefined): string {
    if (!subjectArea) {
      return 'jobOverviewPage.ariaLabels.subscribeToSubjectArea';
    }

    return this.isSubjectAreaSubscribed()
      ? 'jobOverviewPage.ariaLabels.subjectAreaSubscribed'
      : 'jobOverviewPage.ariaLabels.subscribeToSubjectArea';
  }
}

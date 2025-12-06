import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import dayjs from 'dayjs/esm';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import SharedModule from 'app/shared/shared.module';
import { JobCardDTO } from 'app/generated/model/jobCardDTO';

export type ApplicationStatusExtended = JobCardDTO.ApplicationStateEnum | 'NOT_YET_APPLIED';

export const ApplicationStatusExtended = {
  ...JobCardDTO.ApplicationStateEnum,
  NotYetApplied: 'NOT_YET_APPLIED' as ApplicationStatusExtended,
};

@Component({
  selector: 'jhi-job-card',
  templateUrl: './job-card.component.html',
  imports: [FontAwesomeModule, CardModule, CommonModule, SharedModule, TooltipModule, TranslateModule],
})
export class JobCardComponent {
  jobId = input<string>('');
  jobTitle = input<string>('');
  departmentName = input<string>('');
  researchArea = input<string>('');
  location = input<string>('');
  professor = input<string>('');
  workload = input<number | undefined>(undefined);
  startDate = input<string | undefined>('');
  relativeTime = input<string>('');
  applicationId = input<string | undefined>(undefined);
  contractDuration = input<number | undefined>(undefined);

  applicationState = input<ApplicationStatusExtended>(ApplicationStatusExtended.NotYetApplied);

  // TO-DO: Replace value of headerColor with a color corresponding to the field of study
  headerColor = input<string>('var(--p-secondary-color)');
  // Optional header background image
  headerImageUrl = input<string | undefined>(undefined);
  // TO-DO: Replace value of icon with an icon corresponding to the field of study
  icon = input<string>('flask-vial');
  ref: DynamicDialogRef | undefined;

  readonly formattedStartDate = computed(() => (this.startDate() !== undefined ? dayjs(this.startDate()).format('DD.MM.YYYY') : undefined));
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

  ApplicationStateEnumLocal = JobCardDTO.ApplicationStateEnum;

  private router = inject(Router);

  onViewDetails(): void {
    void this.router.navigate([`/job/detail/${this.jobId()}`]);
  }
}

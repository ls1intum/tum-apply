import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import dayjs from 'dayjs/esm';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import SharedModule from '../../../shared/shared.module';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import { JobCardDTO } from '../../../generated/model/jobCardDTO';

export type ApplicationStatusExtended = JobCardDTO.ApplicationStateEnum | 'NOT_YET_APPLIED';

export const ApplicationStatusExtended = {
  ...JobCardDTO.ApplicationStateEnum,
  NotYetApplied: 'NOT_YET_APPLIED' as ApplicationStatusExtended,
};

@Component({
  selector: 'jhi-job-card',
  templateUrl: './job-card.component.html',
  styleUrls: ['./job-card.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, CardModule, ButtonComponent, CommonModule, SharedModule, TooltipModule],
})
export class JobCardComponent {
  jobId = input<string>('');
  jobTitle = input<string>('');
  fieldOfStudies = input<string>('');
  location = input<string>('');
  professor = input<string>('');
  workload = input<number | undefined>(undefined);
  startDate = input<string | undefined>('');
  relativeTime = input<string>('');
  applicationId = input<string | undefined>(undefined);

  applicationState = input<ApplicationStatusExtended>(ApplicationStatusExtended.NotYetApplied);

  // TO-DO: Replace value of headerColor with a color corresponding to the field of study
  headerColor = input<string>('var(--p-secondary-color)');
  // TO-DO: Replace value of icon with an icon corresponding to the field of study
  icon = input<string>('flask-vial');
  ref: DynamicDialogRef | undefined;

  readonly formattedStartDate = computed(() => (this.startDate() !== undefined ? dayjs(this.startDate()).format('DD.MM.YYYY') : undefined));
  translate = inject(TranslateService);

  ApplicationStateEnumLocal = JobCardDTO.ApplicationStateEnum;

  private router = inject(Router);

  onViewDetails(): void {
    this.router.navigate([`/job/detail/${this.jobId()}`]);
  }

  onApply(): void {
    this.router.navigate(['/application/form'], {
      queryParams: {
        job: this.jobId(),
      },
    });
  }

  onEdit(): void {
    this.router.navigate(['/application/form'], {
      queryParams: {
        job: this.jobId(),
        application: this.applicationId(),
      },
    });
  }

  onView(): void {
    this.router.navigate([`/application/detail/${this.applicationId()}`]);
  }
}

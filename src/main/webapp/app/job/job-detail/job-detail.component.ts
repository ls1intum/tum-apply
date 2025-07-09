import { Component, Signal, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import dayjs from 'dayjs/esm';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';

import { JobDetailDTO, JobResourceService } from '../../generated';
import TranslateDirective from '../../shared/language/translate.directive';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../../shared/components/molecules/button-group/button-group.component';
import { TagComponent } from '../../shared/components/atoms/tag/tag.component';

export interface JobDetails {
  supervisingProfessor: string;
  researchGroup: string;
  title: string;
  fieldOfStudies: string;
  researchArea: string;
  location: string;
  workload: string;
  contractDuration: string;
  fundingType: string;
  description: string;
  tasks: string;
  requirements: string;
  startDate: string;
  createdAt: string;
  lastModifiedAt: string;

  researchGroupDescription: string;
  researchGroupEmail: string;
  researchGroupWebsite: string;
  researchGroupStreet: string;
  researchGroupPostalCode: string;
  researchGroupCity: string;

  jobState: string | undefined;
  belongsToResearchGroup: boolean;
}

@Component({
  selector: 'jhi-job-detail',
  imports: [ButtonComponent, FontAwesomeModule, TranslateDirective, TranslateModule, ButtonGroupComponent, TagComponent],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.scss',
})
export class JobDetailComponent {
  userId = signal<string>('');
  jobId = signal<string>('');

  jobDetails = signal<JobDetails | null>(null);

  dataLoaded = signal<boolean>(false);

  noData = computed<string>(() => {
    this.langChange();
    return this.translate.instant('jobDetailPage.noData');
  });

  readonly rightActionButtons = computed<ButtonGroupData | null>(() => {
    const job = this.jobDetails();
    if (!job) return null;

    // Case 1: Not a research group member → show Apply button
    if (!job.belongsToResearchGroup) {
      return {
        direction: 'horizontal',
        buttons: [
          {
            // TO-DO
            // label: this.translate.instant('jobDetailPage.actions.apply'),
            label: 'Apply',
            severity: 'primary',
            onClick: () => this.onApply(),
            disabled: false,
          },
        ],
      };
    }
    // Case 2: DRAFT → show Edit + Delete buttons
    if (job.jobState === 'DRAFT') {
      return {
        direction: 'horizontal',
        buttons: [
          {
            label: this.translate.instant('myPositionsPage.actionButton.edit'),
            severity: 'primary',
            variant: 'outlined',
            onClick: () => this.onEditJob(),
            disabled: false,
          },
          {
            label: this.translate.instant('myPositionsPage.actionButton.delete'),
            severity: 'danger',
            onClick: () => void this.onDeleteJob(),
            disabled: false,
          },
        ],
      };
    }
    // Case 3: PUBLISHED → show Close button
    if (job.jobState === 'PUBLISHED') {
      return {
        direction: 'horizontal',
        buttons: [
          {
            label: this.translate.instant('myPositionsPage.actionButton.close'),
            severity: 'danger',
            variant: 'outlined',
            onClick: () => void this.onCloseJob(),
            disabled: false,
          },
        ],
      };
    }
    // Else → no buttons
    return null;
  });

  readonly stateTextMap = computed<Record<string, string>>(() => ({
    DRAFT: this.translate.instant('myPositionsPage.state.draft'),
    PUBLISHED: this.translate.instant('myPositionsPage.state.published'),
    CLOSED: this.translate.instant('myPositionsPage.state.closed'),
    APPLICANT_FOUND: this.translate.instant('myPositionsPage.state.applicantFound'),
  }));

  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    DRAFT: 'info',
    PUBLISHED: 'success',
    CLOSED: 'danger',
    APPLICANT_FOUND: 'warn',
  });

  private jobResourceService = inject(JobResourceService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private langChange: Signal<LangChangeEvent | undefined> = toSignal(this.translate.onLangChange, { initialValue: undefined });
  private location = inject(Location);

  constructor(private route: ActivatedRoute) {
    this.init();
  }

  onBack(): void {
    this.location.back();
  }

  onApply(): void {
    this.router.navigate([`/application/create/${this.jobId()}`]);
  }

  onEditJob(): void {
    if (!this.jobId()) {
      console.error('Unable to edit job with job id:', this.jobId());
    }
    this.router.navigate([`/job/edit/${this.jobId()}`]);
  }

  async onCloseJob(): Promise<void> {
    // TO-DO: adjust confirmation
    const confirmClose = confirm('Do you really want to close this job?');
    if (confirmClose) {
      try {
        await firstValueFrom(this.jobResourceService.changeJobState(this.jobId(), 'CLOSED'));
        alert('Job successfully closed');
        this.location.back();
      } catch (error) {
        if (error instanceof Error) {
          alert(`Error closing job: ${error.message}`);
        }
      }
    }
  }

  async onDeleteJob(): Promise<void> {
    // TO-DO: adjust confirmation
    const confirmDelete = confirm('Do you really want to delete this job?');
    if (confirmDelete) {
      try {
        await firstValueFrom(this.jobResourceService.deleteJob(this.jobId()));
        alert('Job successfully deleted');
        this.location.back();
      } catch (error) {
        if (error instanceof Error) {
          alert(`Error deleting job: ${error.message}`);
        }
      }
    }
  }

  async init(): Promise<void> {
    try {
      // Get logged-in user
      this.userId.set(this.accountService.loadedUser()?.id ?? '');

      // Get current job from route parameters
      this.jobId.set(this.route.snapshot.paramMap.get('job_id') ?? '');
      if (this.jobId() === '') {
        console.error('Invalid job ID');
        this.location.back();
        return;
      }

      const job = await firstValueFrom(this.jobResourceService.getJobDetails(this.jobId()));
      this.loadJobDetails(job);
      this.dataLoaded.set(true);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        alert(`Error loading job details: ${error.status} ${error.statusText}`);
      } else if (error instanceof Error) {
        alert(`Error loading job details: ${error.message}`);
      }
      this.location.back();
    }
  }

  loadJobDetails(job: JobDetailDTO): void {
    const loadedJob: JobDetails = {
      supervisingProfessor: job.supervisingProfessorName,
      researchGroup: job.researchGroup.name ?? '',
      title: job.title,
      fieldOfStudies: job.fieldOfStudies ?? '',
      researchArea: job.researchArea ?? '',
      location: job.location ?? '',
      workload: job.workload?.toString() ?? '',
      contractDuration: job.contractDuration?.toString() ?? '',
      fundingType: job.fundingType ?? '',
      description: job.description ?? '',
      tasks: job.tasks ?? '',
      requirements: job.requirements ?? '',
      startDate: dayjs(job.startDate).format('DD.MM.YYYY'),
      createdAt: dayjs(job.createdAt).format('DD.MM.YYYY'),
      lastModifiedAt: dayjs(job.lastModifiedAt).format('DD.MM.YYYY'),

      researchGroupDescription: job.researchGroup.description ?? '',
      researchGroupEmail: job.researchGroup.email ?? '',
      researchGroupWebsite: job.researchGroup.website ?? '',
      researchGroupStreet: job.researchGroup.street ?? '',
      researchGroupPostalCode: job.researchGroup.postalCode ?? '',
      researchGroupCity: job.researchGroup.city ?? '',

      jobState: job.state,
      belongsToResearchGroup: job.researchGroup.researchGroupId === this.accountService.loadedUser()?.researchGroup?.researchGroupId,
    };

    this.jobDetails.set(loadedJob);
  }
}

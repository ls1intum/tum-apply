import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import dayjs from 'dayjs/esm';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { firstValueFrom } from 'rxjs';

import { JobDetailDTO, JobResourceService } from '../../generated';
import TranslateDirective from '../../shared/language/translate.directive';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-job-detail',
  imports: [ButtonComponent, FontAwesomeModule, TranslateDirective, TranslateModule],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.scss',
})
export class JobDetailComponent {
  userId = signal<string>('');
  jobId = signal<string>('');
  supervisingProfessor = signal<string>('');
  researchGroup = signal<string>('');
  title = signal<string>('');
  fieldOfStudies = signal<string>('');
  researchArea = signal<string>('');
  location = signal<string>('');
  workload = signal<number>(0);
  contractDuration = signal<number>(0);
  fundingType = signal<string>('');
  description = signal<string>('');
  tasks = signal<string>('');
  requirements = signal<string>('');
  startDate = signal<string>('');
  createdAt = signal<string>('');
  lastModifiedAt = signal<string>('');

  // display research group info
  researchGroupDescription = signal<string>('');
  researchGroupEmail = signal<string>('');
  researchGroupWebsite = signal<string>('');
  researchGroupStreet = signal<string>('');
  researchGroupPostalCode = signal<string>('');
  researchGroupCity = signal<string>('');
  belongsToResearchGroup = signal<boolean>(false);

  dataLoaded = signal<boolean>(false);

  readonly NO_DATA = 'Not Available';

  private jobResourceService = inject(JobResourceService);
  private accountService = inject(AccountService);
  private router = inject(Router);

  constructor(private route: ActivatedRoute) {
    this.init();
  }

  onApply(): void {
    this.router.navigate([`/application/create/${this.jobId()}`]);
  }

  async init(): Promise<void> {
    try {
      // Get logged-in user
      this.userId.set(this.accountService.loadedUser()?.id ?? '');
      if (this.userId() === '') {
        console.error('User not authenticated');
        this.router.navigate(['/login']);
        return;
      }
      // Get current job from route parameters
      this.jobId.set(this.route.snapshot.paramMap.get('job_id') ?? '');
      if (this.jobId() === '') {
        console.error('Invalid job ID');
        this.router.navigate(['/']);
        return;
      }

      const job = await firstValueFrom(this.jobResourceService.getJobDetails(this.jobId(), this.userId()));
      this.loadJobDetails(job);
      this.dataLoaded.set(true);
    } catch (error) {
      console.error('Initialization error:', error);
      this.router.navigate(['/']);
    }
  }

  loadJobDetails(job: JobDetailDTO): void {
    this.supervisingProfessor.set(job.supervisingProfessorName ?? this.NO_DATA);
    this.researchGroup.set(job.researchGroup?.name ?? this.NO_DATA);
    this.title.set(job.title ?? this.NO_DATA);
    this.fieldOfStudies.set(job.fieldOfStudies ?? this.NO_DATA);
    this.researchArea.set(job.researchArea ?? this.NO_DATA);
    this.location.set(job.location ?? this.NO_DATA);
    this.workload.set(job.workload ?? 0);
    this.contractDuration.set(job.contractDuration ?? 0);
    this.fundingType.set(job.fundingType ?? this.NO_DATA);
    this.description.set(job.description ?? this.NO_DATA);
    this.tasks.set(job.tasks ?? this.NO_DATA);
    this.requirements.set(job.requirements ?? this.NO_DATA);
    this.startDate.set(dayjs(job.startDate).format('DD.MM.YYYY'));
    this.createdAt.set(dayjs(job.createdAt).format('DD.MM.YYYY'));
    this.lastModifiedAt.set(dayjs(job.lastModifiedAt).format('DD.MM.YYYY'));
    this.researchGroupDescription.set(job.researchGroup?.description ?? this.NO_DATA);
    this.researchGroupEmail.set(job.researchGroup?.email ?? this.NO_DATA);
    this.researchGroupWebsite.set(job.researchGroup?.website ?? this.NO_DATA);
    this.researchGroupStreet.set(job.researchGroup?.street ?? this.NO_DATA);
    this.researchGroupPostalCode.set(job.researchGroup?.postalCode ?? this.NO_DATA);
    this.researchGroupCity.set(job.researchGroup?.city ?? this.NO_DATA);
    this.belongsToResearchGroup.set(job.belongsToResearchGroup ?? false);
  }
}

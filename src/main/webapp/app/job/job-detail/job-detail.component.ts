import { Component, inject, input } from '@angular/core';
import { JobDTO } from '../../generated';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TagComponent } from '../../shared/components/atoms/tag/tag.component';

@Component({
  selector: 'jhi-job-detail',
  imports: [ButtonComponent, FontAwesomeModule, TagComponent],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.scss',
})
export class JobDetailComponent {
  jobId = input<string>('');
  supervisingProfessor = input<string>('Prof. Stephan Krusche');
  researchGroup = input<string>('Applied Education Technologies');
  title = input<string>('Doctorate in AI');
  fieldOfStudies = input<string>('Computer Science');
  researchArea = input<string>('Molecular AI');
  location = input<JobDTO.LocationEnum>(JobDTO.LocationEnum.Garching);
  workload = input<number>(100);
  contractDuration = input<number>(3);
  fundingType = input<JobDTO.FundingTypeEnum>(JobDTO.FundingTypeEnum.FullyFunded);
  description = input<string>('Test description');
  tasks = input<string>('Test tasks');
  requirements = input<string>('Test requirements');
  startDate = input<Date>(new Date('2024-01-01'));
  createdAt = input<Date>(new Date('2024-01-01'));
  lastModifiedAt = input<Date>(new Date('2024-01-01'));
  researchGroupDescription = input<string>('Test research group description');
  researchGroupEmail = input<string>('https://www.example.com/research-group');
  reseachGroupWebsite = input<string>('https://www.example.com/research-group');
  researchGroupStreet = input<string>('Example Street 1');
  researchGroupPostalCode = input<string>('12345');
  researchGroupCity = input<string>('Example City');
  // display research group info

  private router = inject(Router);

  onApply(): void {
    this.router.navigate([`/application/create/${this.jobId()}`]);
  }

  protected readonly alert = alert;
}

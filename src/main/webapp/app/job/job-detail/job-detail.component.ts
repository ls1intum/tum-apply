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
  title = input<string>('Doctorate Position in Advanced Materials Science');
  fieldOfStudies = input<string>('Computer Science');
  researchArea = input<string>('Molecular AI');
  location = input<JobDTO.LocationEnum>(JobDTO.LocationEnum.Garching);
  workload = input<number>(100);
  contractDuration = input<number>(3);
  fundingType = input<JobDTO.FundingTypeEnum>(JobDTO.FundingTypeEnum.FullyFunded);
  description = input<string>('Test description');
  tasks = input<string>('Test tasks');
  requirements = input<string>(`
  <p><strong>Minimum Qualifications:</strong></p>
  <ol>
    <li>Master’s degree in <em>Materials Science</em>, <em>Chemistry</em>, <em>Physics</em>, or a related discipline.</li>
    <li>Strong foundation in <u>nanomaterial synthesis</u> and <u>electrochemical testing</u>.</li>
    <li>Excellent academic track record with proven research aptitude.</li>
  </ol>

  <p><strong>Technical Skills:</strong></p>
  <ul>
    <li>Experience with characterization techniques such as:
      <ul>
        <li>Scanning Electron Microscopy (SEM)</li>
        <li>X-ray Photoelectron Spectroscopy (XPS)</li>
        <li>Raman Spectroscopy</li>
      </ul>
    </li>
    <li>Basic programming experience in <code>Python</code> or <code>MATLAB</code> is a plus.</li>
  </ul>

  <p><strong>Language & Soft Skills:</strong></p>
  <ul>
    <li>Excellent written and spoken English skills (B2 level or higher).</li>
    <li>Ability to work independently as well as in a collaborative team environment.</li>
  </ul>

  <p>
    For additional eligibility details, please visit the
    <a href="https://www.tum.de/en/studies/doctorate/" target="_blank" rel="noopener">TUM Doctoral Programs page</a>.
  </p>
`);
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

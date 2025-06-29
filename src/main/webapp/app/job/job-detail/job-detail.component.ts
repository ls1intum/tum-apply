import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import dayjs from 'dayjs/esm';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../shared/language/translate.directive';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-job-detail',
  imports: [ButtonComponent, FontAwesomeModule, TranslateDirective, TranslateModule],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.scss',
})
export class JobDetailComponent {
  jobId = input<string>('');
  supervisingProfessor = input<string>('Prof. Stephan Krusche');
  researchGroup = input<string>('Applied Education Technologies');
  title = input<string>('Doctorate Position in Advanced Materials Science');
  fieldOfStudies = input<string>('Computer Science');
  researchArea = input<string>('Advanced Nanocomposite Materials for Energy Storage');
  location = input<string>('Garching');
  workload = input<number>(30);
  contractDuration = input<number>(3);
  fundingType = input<string>('Fully Funded');
  description = input<string>(`
    <p>This exciting PhD position focuses on developing next-generation nanocomposite materials for advanced energy storage applications. The successful candidate will work on synthesizing novel graphene-based composites with enhanced electrochemical properties for use in high-performance batteries and supercapacitors. The project involves cutting-edge characterization techniques including electron microscopy, X-ray spectroscopy, and electrochemical testing. The research will contribute to our understanding of structure-property relationships in nanocomposite materials and has direct applications in sustainable energy technologies. You will be part of an international team working on breakthrough technologies that could revolutionize energy storage systems.</p>`);
  tasks = input<string>(`
  <ol>
    <li>Design and synthesize novel nanocomposite materials using advanced chemical methods</li>
    <li>Characterize materials using state-of-the-art analytical techniques (SEM, TEM, XPS, Raman)</li>
    <li>Conduct electrochemical testing and performance evaluation of energy storage devices</li>
    <li>Analyze experimental data and develop structure-property correlations</li>
    <li>Present research findings at international conferences and publish in high-impact journals</li>
    <li>Collaborate with industry partners and international research institutions</li>
    <li>Mentor undergraduate students and assist in laboratory management</li>
  </ol>`);
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
  startDate = input<string>(dayjs(new Date('2024-01-01')).format('DD.MM.YYYY'));
  createdAt = input<string>(dayjs(new Date('2024-01-01')).format('DD.MM.YYYY'));
  lastModifiedAt = input<string>(dayjs(new Date('2026-01-11')).format('DD.MM.YYYY'));

  // display research group info
  researchGroupDescription = input<string>(
    `Our research group focuses on developing innovative materials for energy and environmental applications. We combine theoretical modeling with experimental synthesis to create materials with tailored properties for specific applications. Our interdisciplinary approach brings together expertise in chemistry, physics, and engineering.<ol><li>test</li><li>test2</li> </ol>`,
  );
  researchGroupEmail = input<string>('data@tum.de');
  researchGroupWebsite = input<string>('https://db.in.tum.de/');
  researchGroupStreet = input<string>('Lichtenbergstraße 4');
  researchGroupPostalCode = input<string>('85748');
  researchGroupCity = input<string>('Garching b. München');

  private router = inject(Router);

  onApply(): void {
    this.router.navigate([`/application/create/${this.jobId()}`]);
  }

  protected readonly alert = alert;
}

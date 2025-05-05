import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { JobResourceService } from 'app/generated/api/jobResource.service';
import { JobFormDTO } from '../../../generated';

@Component({
  selector: 'jhi-job-creation-form',
  standalone: true,
  templateUrl: './job-creation-form.component.html',
  styleUrls: ['./job-creation-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  providers: [JobResourceService],
})
export class JobCreationFormComponent {
  readonly faCircleInfo = faCircleInfo;
  readonly faChevronDown = faChevronDown;
  currentStep = 1;
  // Form groups for each step
  basicInfoForm: FormGroup = this.fb.group({});
  positionDetailsForm: FormGroup = this.fb.group({});
  // Options for dropdowns
  locations = [
    { label: 'Munich Campus', value: JobFormDTO.LocationEnum.Munich },
    { label: 'Garching Campus', value: JobFormDTO.LocationEnum.Garching },
    { label: 'Weihenstephan Campus', value: JobFormDTO.LocationEnum.Weihenstephan },
  ]; // additionalInfoForm: FormGroup = this.fb.group({});
  workloadOptions = ['Full-time (100%)', 'Part-time (75%)', 'Part-time (50%)'];
  contractDurations = ['3 years', '4 years', '5 years'];
  fundingTypes = [
    { label: 'University Budget', value: JobFormDTO.FundingTypeEnum.FullyFunded },
    { label: 'Government Funding', value: JobFormDTO.FundingTypeEnum.GovernmentFunded },
    { label: 'Self Funding', value: JobFormDTO.FundingTypeEnum.SelfFunded },
    { label: 'Industry Sponsored', value: JobFormDTO.FundingTypeEnum.IndustrySponsored },
    { label: 'Scholarship', value: JobFormDTO.FundingTypeEnum.Scholarship },
    { label: 'Research Grant', value: JobFormDTO.FundingTypeEnum.ResearchGrant },
  ];
  private jobResourceService = inject(JobResourceService);

  constructor(private fb: FormBuilder) {
    this.initForms();
  }

  initForms(): void {
    // Basic Information form
    this.basicInfoForm = this.fb.group({
      jobTitle: [''],
      researchArea: [''],
      fieldOfStudies: [''],
      supervisingProfessor: this.fb.control(
        {
          value: 'Prof. Dr. Stephan Krusche',
          disabled: true,
        },
        Validators.required,
      ),
      location: ['', Validators.required],
      startDate: [''],
      workload: [''],
      contractDuration: [''],
      fundingType: ['', Validators.required],
    });

    // Position Details form
    this.positionDetailsForm = this.fb.group({
      description: [''],
      tasks: [''],
      requirements: [''],
    });

    // Additional Information form
    // this.additionalInfoForm = this.fb.group({
    //   customQuestions: [[]],
    // });
  }

  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  saveDraft(): void {
    // Logic to save draft
    console.warn('Saving draft...');
    console.warn({
      ...this.basicInfoForm.value,
      ...this.positionDetailsForm.value,
      // ...this.additionalInfoForm.value,
    });
  }

  publishJob(): void {
    const jobFormDto: JobFormDTO = {
      title: this.basicInfoForm.value.jobTitle,
      supervisingProfessor: '00000000-0000-0000-0000-000000000102',
      location: this.basicInfoForm.value.location,
      fundingType: this.basicInfoForm.value.fundingType,
      state: JobFormDTO.StateEnum.Published,
    };
    this.jobResourceService.createJob(jobFormDto).subscribe({
      next: () => {
        console.log('Job successfully published!');
      },
      error: err => {
        console.error('Failed to publish job:', err);
      },
    });

    // Logic to publish job
    console.warn('Publishing job...');
    console.warn({
      ...this.basicInfoForm.value,
      ...this.positionDetailsForm.value,
      // ...this.additionalInfoForm.value,
    });
  }
}

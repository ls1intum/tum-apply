import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faCircleInfo, faFloppyDisk, faLocationDot, faUser } from '@fortawesome/free-solid-svg-icons';
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
  readonly faChevronLeft = faChevronLeft;
  readonly faLocationDot = faLocationDot;
  readonly faFloppyDisk = faFloppyDisk;
  readonly faUser = faUser;

  currentStep = 1;

  // Form groups for each step
  basicInfoForm: FormGroup = this.fb.group({});
  positionDetailsForm: FormGroup = this.fb.group({});
  additionalInformationForm: FormGroup = this.fb.group({});

  // Options for dropdowns
  locations = [
    { label: 'Munich Campus', value: JobFormDTO.LocationEnum.Munich },
    { label: 'Garching Campus', value: JobFormDTO.LocationEnum.Garching },
    { label: 'Weihenstephan Campus', value: JobFormDTO.LocationEnum.Weihenstephan },
  ];
  workloadOptions = [
    { label: '100% (Full-time)', value: 100 },
    { label: '60%', value: 60 },
    { label: '40%', value: 40 },
    { label: '20%', value: 20 },
    { label: '10%', value: 10 },
  ];
  contractDurations = [
    { label: '1 year', value: 1 },
    { label: '2 years', value: 2 },
    { label: '3 years', value: 3 },
    { label: '4 years', value: 4 },
    { label: '5+ years', value: 5 },
  ];
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

  get descriptionLength(): number {
    return this.positionDetailsForm.get('description')?.value?.length ?? 0;
  }

  get tasksLength(): number {
    return this.positionDetailsForm.get('tasks')?.value?.length ?? 0;
  }

  get requirementsLength(): number {
    return this.positionDetailsForm.get('requirements')?.value?.length ?? 0;
  }

  initForms(): void {
    // Basic Information form
    this.basicInfoForm = this.fb.group({
      title: [''],
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
      description: ['', [Validators.maxLength(1000)]],
      tasks: ['', [Validators.maxLength(1000)]],
      requirements: ['', [Validators.maxLength(1000)]],
    });

    // Additional Information form
    this.additionalInformationForm = this.fb.group({});
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
    const jobFormDto: JobFormDTO = {
      title: this.basicInfoForm.value.title,
      researchArea: this.basicInfoForm.value.researchArea,
      fieldOfStudies: this.basicInfoForm.value.fieldOfStudies,
      supervisingProfessor: '00000000-0000-0000-0000-000000000102',
      location: this.basicInfoForm.value.location,
      startDate: this.basicInfoForm.value.startDate,
      workload: this.basicInfoForm.value.workload,
      contractDuration: this.basicInfoForm.value.contractDuration,
      fundingType: this.basicInfoForm.value.fundingType,
      description: this.positionDetailsForm.value.description,
      tasks: this.positionDetailsForm.value.tasks,
      requirements: this.positionDetailsForm.value.requirements,
      state: JobFormDTO.StateEnum.Draft,
    };
    this.jobResourceService.createJob(jobFormDto).subscribe({
      next() {},
      error(err) {
        console.error('Failed to create job draft:', err);
      },
    });
  }

  publishJob(): void {
    const jobFormDto: JobFormDTO = {
      title: this.basicInfoForm.value.title,
      researchArea: this.basicInfoForm.value.researchArea,
      fieldOfStudies: this.basicInfoForm.value.fieldOfStudies,
      supervisingProfessor: '00000000-0000-0000-0000-000000000102',
      location: this.basicInfoForm.value.location,
      startDate: this.basicInfoForm.value.startDate,
      workload: this.basicInfoForm.value.workload,
      contractDuration: this.basicInfoForm.value.contractDuration,
      fundingType: this.basicInfoForm.value.fundingType,
      description: this.positionDetailsForm.value.description,
      tasks: this.positionDetailsForm.value.tasks,
      requirements: this.positionDetailsForm.value.requirements,
      state: JobFormDTO.StateEnum.Published,
    };
    this.jobResourceService.createJob(jobFormDto).subscribe({
      next() {},
      error(err) {
        console.error('Failed to publish job:', err);
      },
    });
  }
}

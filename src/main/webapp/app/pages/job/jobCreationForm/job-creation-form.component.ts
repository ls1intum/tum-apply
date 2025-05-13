import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { JobResourceService } from 'app/generated/api/jobResource.service';

import { DropdownComponent } from '../../../shared/components/atoms/dropdown/dropdown.component';
import { JobFormDTO } from '../../../generated';
import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';

@Component({
  selector: 'jhi-job-creation-form',
  standalone: true,
  templateUrl: './job-creation-form.component.html',
  styleUrls: ['./job-creation-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, DropdownComponent, DatePickerComponent],
  providers: [JobResourceService],
})
export class JobCreationFormComponent {
  currentStep = 1;

  // Form groups for each step
  basicInfoForm: FormGroup = this.fb.group({});
  positionDetailsForm: FormGroup = this.fb.group({});
  additionalInformationForm: FormGroup = this.fb.group({});

  // Options for dropdowns
  locations = [
    { name: 'Garching Campus', value: JobFormDTO.LocationEnum.Garching },
    { name: 'Garching Hochbrueck Campus', value: JobFormDTO.LocationEnum.GarchingHochbrueck },
    { name: 'Heilbronn Campus', value: JobFormDTO.LocationEnum.Heilbronn },
    { name: 'Munich Campus', value: JobFormDTO.LocationEnum.Munich },
    { name: 'Straubing Campus', value: JobFormDTO.LocationEnum.Straubing },
    { name: 'Weihenstephan Campus', value: JobFormDTO.LocationEnum.Weihenstephan },
    { name: 'Singapore Campus', value: JobFormDTO.LocationEnum.Singapore },
  ];

  fieldsOfStudies = [
    { name: 'Mathematics', value: 'Mathematics' },
    { name: 'Informatics', value: 'Informatics' },
    { name: 'Physics', value: 'Physics' },
    { name: 'Chemistry', value: 'Chemistry' },
    { name: 'Biology', value: 'Biology' },
  ];

  workloadOptions = [
    { name: '100% (Full-time)', value: 100 },
    { name: '60%', value: 60 },
    { name: '40%', value: 40 },
    { name: '20%', value: 20 },
    { name: '10%', value: 10 },
  ];
  contractDurations = [
    { name: '1 year', value: 1 },
    { name: '2 years', value: 2 },
    { name: '3 years', value: 3 },
    { name: '4 years', value: 4 },
    { name: '5+ years', value: 5 },
  ];
  fundingTypes = [
    { name: 'University Budget', value: JobFormDTO.FundingTypeEnum.FullyFunded },
    { name: 'Government Funding', value: JobFormDTO.FundingTypeEnum.GovernmentFunded },
    { name: 'Self Funding', value: JobFormDTO.FundingTypeEnum.SelfFunded },
    { name: 'Industry Sponsored', value: JobFormDTO.FundingTypeEnum.IndustrySponsored },
    { name: 'Scholarship', value: JobFormDTO.FundingTypeEnum.Scholarship },
    { name: 'Research Grant', value: JobFormDTO.FundingTypeEnum.ResearchGrant },
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
      fieldOfStudies: this.basicInfoForm.value.fieldOfStudies.value,
      supervisingProfessor: '00000000-0000-0000-0000-000000000102',
      location: this.basicInfoForm.value.location.value,
      startDate: this.basicInfoForm.value.startDate,
      workload: this.basicInfoForm.value.workload.value,
      contractDuration: this.basicInfoForm.value.contractDuration.value,
      fundingType: this.basicInfoForm.value.fundingType.value,
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
      fieldOfStudies: this.basicInfoForm.value.fieldOfStudies.value,
      supervisingProfessor: '00000000-0000-0000-0000-000000000102',
      location: this.basicInfoForm.value.location.value,
      startDate: this.basicInfoForm.value.startDate,
      workload: this.basicInfoForm.value.workload.value,
      contractDuration: this.basicInfoForm.value.contractDuration.value,
      fundingType: this.basicInfoForm.value.fundingType.value,
      description: this.positionDetailsForm.value.description,
      tasks: this.positionDetailsForm.value.tasks,
      requirements: this.positionDetailsForm.value.requirements,
      state: JobFormDTO.StateEnum.Published,
    };
    // Remove the log line after testing purposes
    console.log('Job DTO:', jobFormDto);
    this.jobResourceService.createJob(jobFormDto).subscribe({
      next() {},
      error(err) {
        console.error('Failed to publish job:', err);
      },
    });
  }

  onSelectionChange(form: FormGroup, controlName: string, value: unknown): void {
    form.patchValue({ [controlName]: value });
  }
}

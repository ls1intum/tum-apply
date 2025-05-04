import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'jhi-job-creation-form',
  standalone: true,
  templateUrl: './job-creation-form.component.html',
  styleUrls: ['./job-creation-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
})
export class JobCreationFormComponent {
  readonly faCircleInfo = faCircleInfo;
  readonly faChevronDown = faChevronDown;

  currentStep = 1;
  // Form groups for each step
  basicInfoForm: FormGroup = this.fb.group({});
  positionDetailsForm: FormGroup = this.fb.group({});
  // additionalInfoForm: FormGroup = this.fb.group({});

  // Options for dropdowns
  locations = ['Munich Campus', 'Garching Campus', 'Weihenstephan Campus'];
  workloadOptions = ['Full-time (100%)', 'Part-time (75%)', 'Part-time (50%)'];
  contractDurations = ['3 years', '4 years', '5 years'];
  fundingTypes = ['University Budget', 'Government Funding', 'Self Funding'];

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

  // TODO: DELETE LATER
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
    // 1. prepare DTO to send to server
    // 2. call service method to send request

    // Logic to publish job
    console.warn('Publishing job...');
    console.warn({
      ...this.basicInfoForm.value,
      ...this.positionDetailsForm.value,
      // ...this.additionalInfoForm.value,
    });
  }
}

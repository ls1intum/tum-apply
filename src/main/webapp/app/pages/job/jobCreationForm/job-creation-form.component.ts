import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

interface BasicInfoForm {
  jobTitle: FormControl<string | null>;
  researchArea: FormControl<string | null>;
  fieldOfStudies: FormControl<string | null>;
  supervisingProfessor: FormControl<string>;
  location: FormControl<string>;
  startDate: FormControl<string | null>;
  workload: FormControl<string | null>;
  contractDuration: FormControl<string | null>;
  fundingType: FormControl<string>;
}

@Component({
  selector: 'jhi-job-creation-form',
  standalone: true,
  templateUrl: './job-creation-form.component.html',
  styleUrls: ['./job-creation-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
})
export class JobCreationFormComponent {
  currentStep = 1;

  // Form groups for each step
  basicInfoForm!: FormGroup<BasicInfoForm>;
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

  get f(): BasicInfoForm {
    return this.basicInfoForm.controls;
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
    }) as FormGroup<BasicInfoForm>;

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
    // Logic to publish job
    console.warn('Publishing job...');
    console.warn({
      ...this.basicInfoForm.value,
      ...this.positionDetailsForm.value,
      // ...this.additionalInfoForm.value,
    });
  }

  isInvalidOrDisabled(control: FormControl): boolean {
    return (control.invalid && control.touched) || control.disabled;
  }
}

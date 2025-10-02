import { Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { StringInputComponent } from '../../../../atoms/string-input/string-input.component';
import { ButtonComponent } from '../../../../atoms/button/button.component';
import { ConfirmDialog } from '../../../../atoms/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../../../service/toast-service';

@Component({
  selector: 'jhi-professor-request-access-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StringInputComponent, ButtonComponent, TranslateModule, ConfirmDialog],
  templateUrl: './professor-request-access-form.component.html',
  styleUrl: './professor-request-access-form.component.scss',
})
export class ProfessorRequestAccessFormComponent {
  // Form
  professorForm = this.createProfessorForm();

  // Loading state
  isSubmitting = signal(false);

  // Template references
  confirmDialog = viewChild<ConfirmDialog>('confirmDialog');

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(DynamicDialogRef, { optional: true });
  private readonly translate = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  onSubmit(): void {
    if (this.professorForm.valid) {
      // Show confirmation dialog before submitting
      this.confirmDialog()?.confirm();
    }
  }

  onConfirmSubmit(): void {
    if (this.professorForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      // TODO: Replace with actual API call
      this.submitRequest()
        .then(result => {
          this.toastService.showSuccessKey('onboarding.professorRequest.success');
          this.ref?.close(result);
        })
        .catch((error: unknown) => {
          this.toastService.showErrorKey('onboarding.professorRequest.error');
          console.error('Failed to submit professor request:', error);
        })
        .finally(() => {
          this.isSubmitting.set(false);
        });
    }
  }

  onCancel(): void {
    this.ref?.close();
  }

  private createProfessorForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      tumID: ['', [Validators.required]],
      researchGroupHead: ['', [Validators.required]],
      researchGroupName: ['', [Validators.required]],
      researchGroupAbbreviation: [''],
      researchGroupContactEmail: [''],
      researchGroupWebsite: [''],
      researchGroupSchool: [''],
      researchGroupDescription: [''],
      researchGroupFieldOfStudies: [''],
      researchGroupStreetAndNumber: [''],
      researchGroupPostalCode: [''],
      researchGroupCity: [''],
      additionalNotes: ['', [Validators.maxLength(1000)]],
    });
  }

  private async submitRequest(): Promise<Record<string, unknown>> {
    // TODO: Implement actual API call to POST /api/onboarding/research-group/request
    // For now, simulate API call with timeout
    return new Promise(resolve => {
      setTimeout(() => {
        console.warn('Submitting form data:', this.professorForm.value);
        resolve(this.professorForm.value);
      }, 1000);
    });
  }
}

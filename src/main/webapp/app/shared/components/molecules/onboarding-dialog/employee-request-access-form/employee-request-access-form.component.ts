import { Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { firstValueFrom } from 'rxjs';

import { StringInputComponent } from '../../../atoms/string-input/string-input.component';
import { ButtonComponent } from '../../../atoms/button/button.component';
import { ConfirmDialog } from '../../../atoms/confirm-dialog/confirm-dialog';
import TranslateDirective from '../../../../language/translate.directive';
import { ToastService } from '../../../../../service/toast-service';
import { ResearchGroupResourceApiService } from '../../../../../generated/api/researchGroupResourceApi.service';
import { ProfOnboardingResourceApiService } from '../../../../../generated/api/profOnboardingResourceApi.service';

@Component({
  selector: 'jhi-employee-request-access-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StringInputComponent, ButtonComponent, TranslateModule, TranslateDirective, ConfirmDialog],
  templateUrl: './employee-request-access-form.component.html',
})
export class EmployeeRequestAccessFormComponent {
  // Form
  employeeForm: FormGroup;

  // Loading state
  isSubmitting = signal(false);

  // Template references
  confirmDialog = viewChild<ConfirmDialog>('confirmDialog');

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(DynamicDialogRef, { optional: true });
  private readonly researchGroupService = inject(ResearchGroupResourceApiService);
  private readonly profOnboardingService = inject(ProfOnboardingResourceApiService);
  private readonly toastService = inject(ToastService);

  constructor() {
    this.employeeForm = this.createEmployeeForm();
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      this.confirmDialog()?.confirm();
    }
  }

  onConfirmSubmit(): void {
    if (this.employeeForm.valid && !this.isSubmitting()) {
      void this.submitEmployeeRequest();
    }
  }

  onCancel(): void {
    this.ref?.close();
  }

  private createEmployeeForm(): FormGroup {
    return this.fb.group({
      professorName: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  private async submitEmployeeRequest(): Promise<void> {
    this.isSubmitting.set(true);
    const professorName = this.employeeForm.get('professorName')?.value.trim();

    try {
      const requestData = { professorName };
      await firstValueFrom(this.researchGroupService.createEmployeeResearchGroupRequest(requestData));

      await firstValueFrom(this.profOnboardingService.confirmOnboarding());

      this.toastService.showSuccessKey('onboarding.employeeRequest.success');
      this.ref?.close();
    } catch {
      this.toastService.showErrorKey('onboarding.employeeRequest.error');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

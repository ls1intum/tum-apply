import { Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ProfessorResearchGroupRequestDTO } from 'app/generated/model/professorResearchGroupRequestDTO';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { firstValueFrom } from 'rxjs';

import { StringInputComponent } from '../../../../atoms/string-input/string-input.component';
import { ButtonComponent } from '../../../../atoms/button/button.component';
import { ConfirmDialog } from '../../../../atoms/confirm-dialog/confirm-dialog';
import { EditorComponent } from '../../../../atoms/editor/editor.component';
import { ToastService } from '../../../../../../service/toast-service';

@Component({
  selector: 'jhi-professor-request-access-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StringInputComponent, ButtonComponent, TranslateModule, ConfirmDialog, EditorComponent],
  templateUrl: './professor-request-access-form.component.html',
  styleUrl: './professor-request-access-form.component.scss',
})
export class ProfessorRequestAccessFormComponent {
  // Form
  professorForm: FormGroup;

  // Loading state
  isSubmitting = signal(false);

  // Template references
  confirmDialog = viewChild<ConfirmDialog>('confirmDialog');

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(DynamicDialogRef, { optional: true });
  private readonly researchGroupService = inject(ResearchGroupResourceApiService);
  private readonly profOnboardingService = inject(ProfOnboardingResourceApiService);
  private readonly translate = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  constructor() {
    // Initialize form after dependency injection is complete
    this.professorForm = this.createProfessorForm();
  }

  onSubmit(): void {
    if (this.professorForm.valid) {
      // Show confirmation dialog before submitting
      this.confirmDialog()?.confirm();
    }
  }

  onConfirmSubmit(): void {
    if (this.professorForm.valid && !this.isSubmitting()) {
      void this.submitProfessorRequest();
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
      researchGroupContactEmail: ['', [Validators.email]],
      researchGroupWebsite: [''],
      researchGroupSchool: [''],
      researchGroupDescription: ['', [Validators.maxLength(1000)]],
      researchGroupFieldOfStudies: [''],
      researchGroupStreetAndNumber: [''],
      researchGroupPostalCode: [''],
      researchGroupCity: [''],
      additionalNotes: [''],
    });
  }

  private async submitProfessorRequest(): Promise<void> {
    this.isSubmitting.set(true);
    const requestData = this.createProfessorResearchGroupRequestDTO();

    try {
      const result = await firstValueFrom(this.researchGroupService.createProfessorResearchGroupRequest(requestData));

      // Mark onboarding as confirmed after successful research group request submission
      await firstValueFrom(this.profOnboardingService.confirmOnboarding());

      this.toastService.showSuccessKey('onboarding.professorRequest.success');
      this.ref?.close(result);
    } catch (error: unknown) {
      this.toastService.showErrorKey('onboarding.professorRequest.error');
      console.error('Failed to submit professor request:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private createProfessorResearchGroupRequestDTO(): ProfessorResearchGroupRequestDTO {
    const v = this.professorForm.getRawValue();

    const s = (val: unknown): string => {
      if (val === undefined || val === null || val === '') return '';
      if (typeof val !== 'string') return '';
      const str = val.trim();
      return str.length === 0 ? '' : str;
    };

    return {
      title: v.title.trim(),
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      universityId: v.tumID.trim(),
      researchGroupHead: v.researchGroupHead.trim(),
      researchGroupName: v.researchGroupName.trim(),
      abbreviation: s(v.researchGroupAbbreviation),
      contactEmail: s(v.researchGroupContactEmail),
      website: s(v.researchGroupWebsite),
      school: s(v.researchGroupSchool),
      description: s(v.researchGroupDescription),
      defaultFieldOfStudies: s(v.researchGroupFieldOfStudies),
      street: s(v.researchGroupStreetAndNumber),
      postalCode: s(v.researchGroupPostalCode),
      city: s(v.researchGroupCity),
    };
  }
}

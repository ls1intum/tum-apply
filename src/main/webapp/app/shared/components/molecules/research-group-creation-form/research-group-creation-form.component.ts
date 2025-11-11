import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupRequestDTO } from 'app/generated/model/researchGroupRequestDTO';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { firstValueFrom } from 'rxjs';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';

import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ConfirmDialog } from '../../atoms/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../service/toast-service';
import { tumIdValidator } from '../../../validators/custom-validators';
import TranslateDirective from '../../../language/translate.directive';

type FormMode = 'professor' | 'admin';

@Component({
  selector: 'jhi-professor-request-access-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StringInputComponent,
    ButtonComponent,
    TranslateModule,
    TranslateDirective,
    ConfirmDialog,
    EditorComponent,
    FontAwesomeModule,
  ],
  templateUrl: './research-group-creation-form.component.html',
})
export class ResearchGroupCreationFormComponent {
  // Input to determine if this is admin mode or professor mode
  mode = computed<FormMode>(() => this.config?.data?.mode ?? 'professor');

  // Form
  form: FormGroup;

  // Loading state
  isSubmitting = signal(false);

  // Template references
  confirmDialog = viewChild<ConfirmDialog>('confirmDialog');

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly config = inject(DynamicDialogConfig, { optional: true });
  private readonly ref = inject(DynamicDialogRef, { optional: true });
  private readonly researchGroupService = inject(ResearchGroupResourceApiService);
  private readonly profOnboardingService = inject(ProfOnboardingResourceApiService);
  private readonly toastService = inject(ToastService);

  constructor() {
    this.form = this.createForm();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.confirmDialog()?.confirm();
    }
  }

  onConfirmSubmit(): void {
    if (this.form.valid && !this.isSubmitting()) {
      void this.submitRequest();
    }
  }

  onCancel(): void {
    this.ref?.close();
  }

  private createForm(): FormGroup {
    const isAdminMode = this.mode() === 'admin';

    return this.fb.group({
      title: [{ value: '', disabled: isAdminMode }, isAdminMode ? [] : [Validators.required]],
      firstName: [{ value: '', disabled: isAdminMode }, isAdminMode ? [] : [Validators.required]],
      lastName: [{ value: '', disabled: isAdminMode }, isAdminMode ? [] : [Validators.required]],
      tumID: ['', [Validators.required, tumIdValidator]],
      researchGroupHead: ['', [Validators.required]],
      researchGroupName: ['', [Validators.required]],
      researchGroupAbbreviation: [''],
      researchGroupContactEmail: ['', [Validators.email, Validators.pattern(/.+\..{2,}$/)]],
      researchGroupWebsite: [''],
      researchGroupSchool: [''],
      researchGroupDescription: ['', [Validators.maxLength(1000)]],
      researchGroupFieldOfStudies: [''],
      researchGroupStreetAndNumber: [''],
      researchGroupPostalCode: [''],
      researchGroupCity: [''],
      additionalNotes: [{ value: '', disabled: isAdminMode }],
    });
  }

  private async submitRequest(): Promise<void> {
    this.isSubmitting.set(true);
    const requestData = this.createResearchGroupRequestDTO();

    try {
      const isAdminMode = this.mode() === 'admin';
      let result;

      if (isAdminMode) {
        // Admin creates research group directly as ACTIVE
        result = await firstValueFrom(this.researchGroupService.createResearchGroupAsAdmin(requestData));
        this.toastService.showSuccessKey('researchGroup.adminView.success.create');
      } else {
        // Professor creates research group as DRAFT (requires approval)
        result = await firstValueFrom(this.researchGroupService.createProfessorResearchGroupRequest(requestData));
        // Mark onboarding as confirmed after successful research group request submission
        await firstValueFrom(this.profOnboardingService.confirmOnboarding());
        this.toastService.showSuccessKey('onboarding.professorRequest.success');
      }

      this.ref?.close(result);
    } catch (error: any) {
      // Check if the error is about a duplicate research group name
      if (error?.error?.message?.includes('already exists') || error?.status === 409) {
        const errorKey =
          this.mode() === 'admin' ? 'researchGroup.adminView.errors.duplicateName' : 'onboarding.professorRequest.errorDuplicateName';
        this.toastService.showErrorKey(errorKey);
      }
      // Check if the error is about a user not found (invalid TUM-ID)
      else if (error?.status === 404 && error?.error?.message?.includes('not found')) {
        const errorKey =
          this.mode() === 'admin' ? 'researchGroup.adminView.errors.userNotFound' : 'onboarding.professorRequest.errorUserNotFound';
        this.toastService.showErrorKey(errorKey);
      }
      // Generic error
      else {
        const errorKey = this.mode() === 'admin' ? 'researchGroup.adminView.errors.create' : 'onboarding.professorRequest.error';
        this.toastService.showErrorKey(errorKey);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private createResearchGroupRequestDTO(): ResearchGroupRequestDTO {
    const v = this.form.getRawValue();

    const s = (val: unknown): string => {
      if (val === undefined || val === null || val === '') return '';
      if (typeof val !== 'string') return '';
      const str = val.trim();
      return str.length === 0 ? '' : str;
    };

    return {
      title: s(v.title),
      firstName: s(v.firstName),
      lastName: s(v.lastName),
      universityId: s(v.tumID),
      researchGroupHead: s(v.researchGroupHead),
      researchGroupName: s(v.researchGroupName),
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

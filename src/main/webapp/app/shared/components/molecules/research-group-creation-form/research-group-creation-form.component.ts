import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupRequestDTO } from 'app/generated/model/researchGroupRequestDTO';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { firstValueFrom, map } from 'rxjs';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { HttpErrorResponse } from '@angular/common/http';

import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ConfirmDialog } from '../../atoms/confirm-dialog/confirm-dialog';
import { InfoBoxComponent } from '../../atoms/info-box/info-box.component';
import { SelectComponent, SelectOption } from '../../atoms/select/select.component';
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
    SelectComponent,
    TranslateModule,
    TranslateDirective,
    ConfirmDialog,
    EditorComponent,
    FontAwesomeModule,
    InfoBoxComponent,
  ],
  templateUrl: './research-group-creation-form.component.html',
})
export class ResearchGroupCreationFormComponent {
  // Input to determine if this is admin mode or professor mode
  mode = computed<FormMode>(() => this.config?.data?.mode ?? 'professor');

  // Form
  form: FormGroup;

  // Track selected school
  selectedSchool = signal<SelectOption | null>(null);

  // Loading state
  isSubmitting = signal(false);

  // Template references
  confirmDialog = viewChild<ConfirmDialog>('confirmDialog');
  readonly researchGroupService = inject(ResearchGroupResourceApiService);

  schoolOptions = toSignal(
    this.researchGroupService
      .getAvailableSchools()
      .pipe(map(schools => schools.map(school => ({ name: school.displayName ?? '', value: school.value ?? '' }) as SelectOption))),
    { initialValue: [] as SelectOption[] },
  );

  readonly allDepartmentOptions = toSignal(
    this.researchGroupService
      .getAvailableDepartments()
      .pipe(map(departments => departments.map(dept => ({ name: dept.displayName ?? '', value: dept.value ?? '' }) as SelectOption))),
    { initialValue: [] as SelectOption[] },
  );

  // Store filtered departments based on selected school
  filteredDepartments = signal<SelectOption[]>([]);

  // Department options - pure computed signal that returns filtered or all departments
  departmentOptions = computed<SelectOption[]>(() => {
    const selectedSchool = this.selectedSchool();

    // If no school selected, return all departments
    if (!selectedSchool) {
      return this.allDepartmentOptions();
    }

    // Return filtered departments
    const filtered = this.filteredDepartments();
    return filtered.length > 0 ? filtered : this.allDepartmentOptions();
  });

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly config = inject(DynamicDialogConfig, { optional: true });
  private readonly ref = inject(DynamicDialogRef, { optional: true });
  private readonly profOnboardingService = inject(ProfOnboardingResourceApiService);
  private readonly toastService = inject(ToastService);

  constructor() {
    this.form = this.createForm();
  }

  async onSchoolChange(selectedSchool: SelectOption | null): Promise<void> {
    this.selectedSchool.set(selectedSchool);

    if (selectedSchool && typeof selectedSchool.value === 'string') {
      try {
        const departments = await firstValueFrom(this.researchGroupService.getDepartmentsBySchool(selectedSchool.value));
        const filtered = departments.map(dept => ({ name: dept.displayName ?? '', value: dept.value ?? '' }) as SelectOption);

        this.filteredDepartments.set(filtered);

        // Clear department selection if it's not in the filtered list
        const currentDepartment = this.form.get('researchGroupDepartment')?.value as SelectOption | null;
        if (currentDepartment) {
          const isDepartmentValid = filtered.some(dept => dept.value === currentDepartment.value);
          if (isDepartmentValid === false) {
            this.form.get('researchGroupDepartment')?.setValue(null);
          }
        }
      } catch {
        // On error, show all departments
        this.filteredDepartments.set(this.allDepartmentOptions());
      }
    } else {
      // No school selected, clear filtered departments to show all
      this.filteredDepartments.set([]);
      this.form.get('researchGroupDepartment')?.setValue(null);
    }
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
      researchGroupDepartment: [null, [Validators.required]],
      researchGroupAbbreviation: [''],
      researchGroupContactEmail: ['', [Validators.email, Validators.pattern(/.+\..{2,}$/)]],
      researchGroupWebsite: [''],
      researchGroupSchool: [null, [Validators.required]],
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
    } catch (error) {
      // Type-safe error handling
      if (error instanceof HttpErrorResponse) {
        const errorMessage = error.error?.message ?? '';

        // Check if the error is about a duplicate research group name
        if (errorMessage.includes('already exists') === true || error.status === 409) {
          const errorKey =
            this.mode() === 'admin' ? 'researchGroup.adminView.errors.duplicateName' : 'onboarding.professorRequest.errorDuplicateName';
          this.toastService.showErrorKey(errorKey);
        }
        // Check if the error is about a user not found (invalid TUM-ID)
        else if (error.status === 404 && errorMessage.includes('not found') === true) {
          const errorKey =
            this.mode() === 'admin' ? 'researchGroup.adminView.errors.userNotFound' : 'onboarding.professorRequest.errorUserNotFound';
          this.toastService.showErrorKey(errorKey);
        } else {
          const errorKey = this.mode() === 'admin' ? 'researchGroup.adminView.errors.create' : 'onboarding.professorRequest.error';
          this.toastService.showErrorKey(errorKey);
        }
      } else {
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
      researchGroupDepartment: v.researchGroupDepartment?.value,
      abbreviation: s(v.researchGroupAbbreviation),
      contactEmail: s(v.researchGroupContactEmail),
      website: s(v.researchGroupWebsite),
      school: v.researchGroupSchool?.value ?? undefined,
      description: s(v.researchGroupDescription),
      defaultFieldOfStudies: s(v.researchGroupFieldOfStudies),
      street: s(v.researchGroupStreetAndNumber),
      postalCode: s(v.researchGroupPostalCode),
      city: s(v.researchGroupCity),
    };
  }
}

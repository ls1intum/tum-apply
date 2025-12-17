import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DepartmentResourceApiService, SchoolResourceApiService } from 'app/generated';
import { SchoolShortDTO } from 'app/generated/model/models';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'jhi-department-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ButtonComponent, StringInputComponent, SelectComponent],
  templateUrl: './department-edit-dialog.component.html',
})
export class DepartmentEditDialogComponent {
  isSubmitting = signal(false);
  schools = signal<SchoolShortDTO[]>([]);

  // Edit mode
  departmentId = signal<string | undefined>(undefined);
  isEditMode = computed(() => !!this.departmentId());

  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(school => ({
      name: school.name ?? '',
      value: school.schoolId ?? '',
    })),
  );

  selectedSchoolId = signal<string | undefined>(undefined);

  selectedSchoolOption = computed<SelectOption | undefined>(() => {
    const schoolId = this.selectedSchoolId();
    if (!schoolId) return undefined;
    return this.schoolOptions().find(opt => opt.value === schoolId);
  });

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    schoolId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly translationKey = 'researchGroup.departments.createDialog';

  private readonly config = inject(DynamicDialogConfig);
  private readonly ref = inject(DynamicDialogRef);
  private readonly departmentService = inject(DepartmentResourceApiService);
  private readonly schoolService = inject(SchoolResourceApiService);
  private readonly toastService = inject(ToastService);

  constructor() {
    const data = this.config.data;
    if (data?.department) {
      this.departmentId.set(data.department.departmentId);
      this.form.patchValue({
        name: data.department.name,
        schoolId: data.department.school?.schoolId,
      });
      this.selectedSchoolId.set(data.department.school?.schoolId);
    }

    void this.loadSchools();
  }

  async loadSchools(): Promise<void> {
    try {
      const schools = await firstValueFrom(this.schoolService.getAllSchools());
      this.schools.set(schools);
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.errors.loadSchoolsFailed`);
    }
  }

  onSchoolChange(option: SelectOption): void {
    this.selectedSchoolId.set(option.value as string);
    this.form.patchValue({ schoolId: option.value as string });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.getRawValue();
    const dto = {
      name: formValue.name,
      schoolId: formValue.schoolId,
    };

    try {
      if (this.isEditMode()) {
        await firstValueFrom(this.departmentService.updateDepartment(this.departmentId()!, dto));
        this.toastService.showSuccessKey(`${this.translationKey}.success.updated`);
      } else {
        await firstValueFrom(this.departmentService.createDepartment(dto));
        this.toastService.showSuccessKey(`${this.translationKey}.success.created`);
      }
      this.ref.close(true);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 409) {
          this.toastService.showErrorKey(`${this.translationKey}.errors.duplicateName`);
        } else {
          this.toastService.showErrorKey(`${this.translationKey}.errors.createFailed`);
        }
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.ref.close(false);
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DepartmentResourceApiService, SchoolResourceApiService } from 'app/generated';
import { SchoolShortDTO } from 'app/generated/model/models';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'jhi-department-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ButtonComponent, StringInputComponent, SelectComponent],
  templateUrl: './departments-view.component.html',
})
export class DepartmentsViewComponent {
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

  selectedSchoolOption = computed(() => {
    const schoolId = this.selectedSchoolId();
    if (!schoolId) return undefined;
    return this.schoolOptions().find(opt => opt.value === schoolId);
  });

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    schoolId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly translationKey = 'researchGroup.departments.createDialog';

  private readonly departmentService = inject(DepartmentResourceApiService);
  private readonly schoolService = inject(SchoolResourceApiService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    const departmentIdFromRoute = this.route.snapshot.paramMap.get('departmentId');
    if (departmentIdFromRoute) {
      this.departmentId.set(departmentIdFromRoute);
      void this.loadDepartment(departmentIdFromRoute);
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
      const departmentId = this.departmentId();
      if (this.isEditMode() && departmentId) {
        await firstValueFrom(this.departmentService.updateDepartment(departmentId, dto));
        this.toastService.showSuccessKey(`${this.translationKey}.success.updated`);
      } else {
        await firstValueFrom(this.departmentService.createDepartment(dto));
        this.toastService.showSuccessKey(`${this.translationKey}.success.created`);
      }
      void this.router.navigate(['/research-group/departments']);
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
    void this.router.navigate(['/research-group/departments']);
  }

  private async loadDepartment(departmentId: string): Promise<void> {
    try {
      const department = await firstValueFrom(this.departmentService.getDepartmentById(departmentId));
      this.form.patchValue({
        name: department.name,
        schoolId: department.school?.schoolId,
      });
      this.selectedSchoolId.set(department.school?.schoolId);
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.errors.loadDepartmentFailed`);
    }
  }
}

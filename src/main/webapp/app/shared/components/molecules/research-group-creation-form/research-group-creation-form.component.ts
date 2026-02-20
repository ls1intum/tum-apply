import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupRequestDTO } from 'app/generated/model/researchGroupRequestDTO';
import { KeycloakUserDTO } from 'app/generated/model/keycloakUserDTO';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { SchoolResourceApiService } from 'app/generated/api/schoolResourceApi.service';
import { DepartmentResourceApiService } from 'app/generated/api/departmentResourceApi.service';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';
import { SchoolShortDTO } from 'app/generated/model/schoolShortDTO';
import { DepartmentDTO } from 'app/generated/model/departmentDTO';
import { firstValueFrom } from 'rxjs';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';

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
    SearchFilterSortBar,
    ProgressSpinnerModule,
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
  isLoadingAdminUsers = signal(false);

  // Admin professor selection
  readonly MIN_ADMIN_SEARCH_LENGTH = 3;
  adminProfessorSearchQuery = signal('');
  adminProfessorCandidates = signal<KeycloakUserDTO[]>([]);
  selectedAdminProfessor = signal<KeycloakUserDTO | undefined>(undefined);

  // School and Department data
  schools = signal<SchoolShortDTO[]>([]);
  departments = signal<DepartmentDTO[]>([]);
  selectedSchoolId = signal<string | undefined>(undefined);
  selectedDepartmentId = signal<string | undefined>(undefined);

  // Computed select options
  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(school => ({
      name: school.name ?? '',
      value: school.schoolId ?? '',
    })),
  );

  departmentOptions = computed<SelectOption[]>(() =>
    this.departments().map(dept => ({
      name: dept.name ?? '',
      value: dept.departmentId ?? '',
    })),
  );

  // Filtered departments based on selected school
  filteredDepartmentOptions = computed<SelectOption[]>(() => {
    const schoolId = this.selectedSchoolId();
    if (schoolId === undefined || schoolId === '') {
      return this.departmentOptions();
    }
    return this.departments()
      .filter(dept => dept.school?.schoolId === schoolId)
      .map(dept => ({
        name: dept.name ?? '',
        value: dept.departmentId ?? '',
      }));
  });

  // Selected options for binding
  selectedSchoolOption = computed<SelectOption | undefined>(() => {
    const schoolId = this.selectedSchoolId();
    if (schoolId === undefined || schoolId === '') return undefined;
    return this.schoolOptions().find(opt => opt.value === schoolId);
  });

  selectedDepartmentOption = computed<SelectOption | undefined>(() => {
    const deptId = this.selectedDepartmentId();
    if (deptId === undefined || deptId === '') return undefined;
    return this.departmentOptions().find(opt => opt.value === deptId);
  });

  // Template references
  confirmDialog = viewChild<ConfirmDialog>('confirmDialog');

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly config = inject(DynamicDialogConfig, { optional: true });
  private readonly ref = inject(DynamicDialogRef, { optional: true });
  private readonly researchGroupService = inject(ResearchGroupResourceApiService);
  private readonly profOnboardingService = inject(ProfOnboardingResourceApiService);
  private readonly schoolService = inject(SchoolResourceApiService);
  private readonly departmentService = inject(DepartmentResourceApiService);
  private readonly userService = inject(UserResourceApiService);
  private readonly toastService = inject(ToastService);
  private readonly USE_MOCK_USERS = window.location.hostname === 'localhost';
  private readonly MOCK_USERS: KeycloakUserDTO[] = [
    {
      id: '7a6b8f3a-09f4-4e9f-8d09-2e2d1a1d8a01',
      firstName: 'Aniruddh',
      lastName: 'Zaveri',
      email: 'aniruddh.zaveri@tum.de',
      universityId: 'ab12asd',
      username: 'aniruddh.zaveri',
    },
    {
      id: '2c9c3d14-1a5b-4a8f-9c21-4b1d9e2a3f02',
      firstName: 'Aniruddh',
      lastName: 'Pawar',
      email: 'aniruddh.pawar@mytum.de',
      universityId: 'ab12adv',
      username: 'aniruddh.pawar',
    },
    {
      id: 'e4b2f1c3-5d6e-4f1a-8b9c-3d4e5f6a7b03',
      firstName: 'Alice',
      lastName: 'Curie',
      email: 'alice.curie@tum.de',
      universityId: 'ab12agf',
      username: 'alice.curie',
    },
    {
      id: 'f5a6b7c8-9d0e-4f1a-8b2c-3d4e5f6a7b04',
      firstName: 'Ben',
      lastName: 'Schmidt',
      email: 'ben.schmidt@mytum.de',
      universityId: 'ab12gkl',
      username: 'ben.schmidt',
    },
    {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c05',
      firstName: 'Carla',
      lastName: 'Nguyen',
      email: 'carla.nguyen@tum.de',
      universityId: 'ab12hij',
      username: 'carla.nguyen',
    },
    {
      id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d06',
      firstName: 'David',
      lastName: 'Ibrahim',
      email: 'david.ibrahim@mytum.de',
      universityId: 'ab12klm',
      username: 'david.ibrahim',
    },
  ];

  constructor() {
    this.form = this.createForm();
    void this.loadSchoolsAndDepartments();
  }

  async loadSchoolsAndDepartments(): Promise<void> {
    try {
      const [schools, departments] = await Promise.all([
        firstValueFrom(this.schoolService.getAllSchools()),
        firstValueFrom(this.departmentService.getDepartments()),
      ]);
      this.schools.set(schools);
      this.departments.set(departments);
    } catch {
      this.toastService.showErrorKey('onboarding.professorRequest.loadDataFailed');
    }
  }

  onSchoolChange(option: SelectOption): void {
    const schoolId = option.value as string;
    this.selectedSchoolId.set(schoolId);

    // Clear department if it doesn't belong to the selected school
    const currentDeptId = this.selectedDepartmentId();
    if (currentDeptId !== undefined && currentDeptId !== '') {
      const dept = this.departments().find(d => d.departmentId === currentDeptId);
      if (dept?.school?.schoolId !== schoolId) {
        this.selectedDepartmentId.set(undefined);
        this.form.patchValue({ departmentId: '' });
      }
    }
  }

  onDepartmentChange(option: SelectOption): void {
    const deptId = option.value as string;
    this.selectedDepartmentId.set(deptId);
    this.form.patchValue({ departmentId: deptId });

    // Auto-update the school filter based on the selected department
    const dept = this.departments().find(d => d.departmentId === deptId);
    const schoolId = dept?.school?.schoolId;
    if (schoolId !== undefined && schoolId !== '') {
      this.selectedSchoolId.set(schoolId);
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

  async onAdminProfessorSearch(searchQuery: string): Promise<void> {
    if (this.mode() !== 'admin') {
      return;
    }

    this.adminProfessorSearchQuery.set(searchQuery);
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < this.MIN_ADMIN_SEARCH_LENGTH) {
      this.adminProfessorCandidates.set([]);
      return;
    }

    if (this.USE_MOCK_USERS) {
      const normalizedQuery = trimmedQuery.toLowerCase();
      const filteredUsers = this.MOCK_USERS.filter(user =>
        `${user.firstName ?? ''} ${user.lastName ?? ''} ${user.email ?? ''}`.toLowerCase().includes(normalizedQuery),
      );
      this.adminProfessorCandidates.set(filteredUsers.slice(0, 10));
      return;
    }

    this.isLoadingAdminUsers.set(true);
    try {
      const response = await firstValueFrom(this.userService.getAvailableUsersForResearchGroup(10, 0, trimmedQuery));
      this.adminProfessorCandidates.set(response.content ?? []);
    } catch {
      this.toastService.showErrorKey('researchGroup.members.toastMessages.loadUsersFailed');
    } finally {
      this.isLoadingAdminUsers.set(false);
    }
  }

  selectAdminProfessor(user: KeycloakUserDTO): void {
    this.selectedAdminProfessor.set(user);
    this.form.patchValue({ tumID: user.universityId ?? '' });
    this.form.get('tumID')?.markAsTouched();
  }

  clearSelectedAdminProfessor(): void {
    this.selectedAdminProfessor.set(undefined);
    this.form.patchValue({ tumID: '' });
    void this.onAdminProfessorSearch(this.adminProfessorSearchQuery());
  }

  isAdminProfessorSelected(user: KeycloakUserDTO): boolean {
    const selected = this.selectedAdminProfessor();
    if (!selected?.id || !user.id) {
      return false;
    }
    return selected.id === user.id;
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
      departmentId: ['', [Validators.required]],
      researchGroupContactEmail: ['', [Validators.email, Validators.pattern(/.+\..{2,}$/)]],
      researchGroupWebsite: [''],
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
        if (errorMessage.includes('already exists') || error.status === 409) {
          const errorKey =
            this.mode() === 'admin' ? 'researchGroup.adminView.errors.duplicateName' : 'onboarding.professorRequest.errorDuplicateName';
          this.toastService.showErrorKey(errorKey);
        }
        // Check if the error is about a user not found (invalid TUM-ID)
        else if (error.status === 404 && errorMessage.includes('not found')) {
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
      abbreviation: s(v.researchGroupAbbreviation),
      departmentId: s(v.departmentId),
      contactEmail: s(v.researchGroupContactEmail),
      website: s(v.researchGroupWebsite),
      description: s(v.researchGroupDescription),
      defaultFieldOfStudies: s(v.researchGroupFieldOfStudies),
      street: s(v.researchGroupStreetAndNumber),
      postalCode: s(v.researchGroupPostalCode),
      city: s(v.researchGroupCity),
    };
  }
}

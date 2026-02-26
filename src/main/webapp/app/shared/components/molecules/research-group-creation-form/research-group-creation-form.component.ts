import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

interface SelectedAdminProfessor {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  universityId?: string;
  username?: string;
}

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
  readonly ADMIN_USERS_PAGE_SIZE = 25;
  adminProfessorSearchQuery = signal('');
  adminProfessorCandidates = signal<KeycloakUserDTO[]>([]);
  adminProfessorTotalCount = signal(0);
  adminProfessorCurrentPage = signal(0);
  hasMoreAdminProfessorCandidates = computed(() => this.adminProfessorCandidates().length < this.adminProfessorTotalCount());
  selectedAdminProfessor = signal<SelectedAdminProfessor | null>(null);

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
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly USE_MOCK_USERS = window.location.hostname === 'localhost';
  private mockUsers = signal<KeycloakUserDTO[] | null>(null);
  private readonly MOCK_USERS_PATH = '/content/mock/keycloak-users.json';
  private readonly ADMIN_LOADER_DELAY_MS = 250;
  private adminLoaderTimeout: number | null = null;
  private latestAdminSearchRequestId = 0;

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

    const requestId = ++this.latestAdminSearchRequestId;

    this.adminProfessorSearchQuery.set(searchQuery);
    const trimmedQuery = searchQuery.trim();

    if (this.adminLoaderTimeout !== null) {
      clearTimeout(this.adminLoaderTimeout);
      this.adminLoaderTimeout = null;
    }

    if (trimmedQuery.length < this.MIN_ADMIN_SEARCH_LENGTH) {
      this.adminProfessorCandidates.set([]);
      this.adminProfessorTotalCount.set(0);
      this.adminProfessorCurrentPage.set(0);
      this.isLoadingAdminUsers.set(false);
      return;
    }

    await this.loadAdminProfessorPage(trimmedQuery, 0, false, requestId);
  }

  async onLoadMoreAdminProfessors(): Promise<void> {
    if (this.mode() !== 'admin' || this.isLoadingAdminUsers() || !this.hasMoreAdminProfessorCandidates()) {
      return;
    }

    const trimmedQuery = this.adminProfessorSearchQuery().trim();
    if (trimmedQuery.length < this.MIN_ADMIN_SEARCH_LENGTH) {
      return;
    }

    const requestId = ++this.latestAdminSearchRequestId;
    const nextPage = this.adminProfessorCurrentPage() + 1;
    await this.loadAdminProfessorPage(trimmedQuery, nextPage, true, requestId);
  }

  selectAdminProfessor(user: KeycloakUserDTO): void {
    this.selectedAdminProfessor.set(user);
    this.form.patchValue({ tumID: user.universityId ?? '' });
    this.form.get('tumID')?.markAsTouched();
  }

  clearSelectedAdminProfessor(): void {
    this.selectedAdminProfessor.set(null);
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

  private async loadMockUsers(): Promise<KeycloakUserDTO[]> {
    const cachedUsers = this.mockUsers();
    if (cachedUsers !== null) {
      return cachedUsers;
    }

    try {
      const users = await firstValueFrom(this.http.get<KeycloakUserDTO[]>(this.MOCK_USERS_PATH));
      this.mockUsers.set(users);
      return users;
    } catch {
      this.mockUsers.set([]);
      this.toastService.showErrorKey('researchGroup.members.toastMessages.loadUsersFailed');
      return [];
    }
  }

  private async loadAdminProfessorPage(searchQuery: string, page: number, append: boolean, requestId: number): Promise<void> {
    this.adminLoaderTimeout = window.setTimeout(() => {
      if (requestId === this.latestAdminSearchRequestId) {
        this.isLoadingAdminUsers.set(true);
      }
    }, this.ADMIN_LOADER_DELAY_MS);

    try {
      if (this.USE_MOCK_USERS) {
        const mockUsers = await this.loadMockUsers();
        if (requestId !== this.latestAdminSearchRequestId) {
          return;
        }

        const normalizedQuery = searchQuery.toLowerCase();
        const filteredUsers = mockUsers.filter(user =>
          `${user.firstName ?? ''} ${user.lastName ?? ''} ${user.email ?? ''}`.toLowerCase().includes(normalizedQuery),
        );

        const startIndex = page * this.ADMIN_USERS_PAGE_SIZE;
        const pageContent = filteredUsers.slice(startIndex, startIndex + this.ADMIN_USERS_PAGE_SIZE);
        const nextCandidates = append ? this.adminProfessorCandidates().concat(pageContent) : pageContent;

        this.adminProfessorCandidates.set(nextCandidates);
        this.adminProfessorTotalCount.set(filteredUsers.length);
        this.adminProfessorCurrentPage.set(page);
        return;
      }

      const response = await firstValueFrom(
        this.userService.getAvailableUsersForResearchGroup(this.ADMIN_USERS_PAGE_SIZE, page, searchQuery),
      );
      if (requestId !== this.latestAdminSearchRequestId) {
        return;
      }

      const pageContent = response.content ?? [];
      const nextCandidates = append ? this.adminProfessorCandidates().concat(pageContent) : pageContent;

      this.adminProfessorCandidates.set(nextCandidates);
      this.adminProfessorTotalCount.set(response.totalElements ?? nextCandidates.length);
      this.adminProfessorCurrentPage.set(page);
    } catch {
      if (requestId === this.latestAdminSearchRequestId) {
        this.toastService.showErrorKey('researchGroup.members.toastMessages.loadUsersFailed');
      }
    } finally {
      if (requestId === this.latestAdminSearchRequestId) {
        clearTimeout(this.adminLoaderTimeout);
        this.adminLoaderTimeout = null;
        this.isLoadingAdminUsers.set(false);
      }
    }
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
        }
        // Check if the error is about professor already being assigned to another research group
        else if (error.status === 400 && errorMessage.toLowerCase().includes('already a member of research group')) {
          const errorKey =
            this.mode() === 'admin' ? 'researchGroup.adminView.errors.userAlreadyMember' : 'onboarding.professorRequest.error';
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

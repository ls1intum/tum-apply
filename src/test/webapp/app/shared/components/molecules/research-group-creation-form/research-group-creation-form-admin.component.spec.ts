import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { ResearchGroupCreationFormComponent } from 'app/shared/components/molecules/research-group-creation-form/research-group-creation-form.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { SchoolResourceApiService } from 'app/generated/api/schoolResourceApi.service';
import { DepartmentResourceApiService } from 'app/generated/api/departmentResourceApi.service';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';
import { provideTranslateMock } from 'util/translate.mock';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { KeycloakUserDTO } from 'app/generated/model/keycloakUserDTO';
import { SchoolShortDTO } from 'app/generated/model/schoolShortDTO';
import { DepartmentDTO } from 'app/generated/model/departmentDTO';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { createDynamicDialogRefMock, DynamicDialogRefMock, provideDynamicDialogRefMock } from 'util/dynamicdialogref.mock';
import { createDynamicDialogConfigMock, provideDynamicDialogConfigMock } from 'util/dynamicdialogref.mock';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientMock } from 'util/http-client.mock';

/**
 * Test suite for ResearchGroupCreationFormComponent - Admin Mode
 * Tests admin-specific functionality for creating research groups
 * Admins can create research groups directly (ACTIVE state)
 * Personal information fields are disabled in admin mode
 */
describe('ResearchGroupCreationFormComponent - Admin Mode', () => {
  let component: ResearchGroupCreationFormComponent;
  let fixture: ComponentFixture<ResearchGroupCreationFormComponent>;

  let mockDialogRef: DynamicDialogRefMock;
  let mockDialogConfig: Partial<DynamicDialogConfig>;
  let mockResearchGroupService: Partial<ResearchGroupResourceApiService>;
  let mockProfOnboardingService: Partial<ProfOnboardingResourceApiService>;
  let mockSchoolService: Partial<SchoolResourceApiService>;
  let mockDepartmentService: Partial<DepartmentResourceApiService>;
  let mockUserService: Partial<UserResourceApiService>;
  let mockGetCurrentUser: ReturnType<typeof vi.fn>;
  let getAvailableUsersForResearchGroupMock: ReturnType<typeof vi.fn>;
  let mockToastService: ToastServiceMock;

  beforeEach(async () => {
    mockDialogRef = createDynamicDialogRefMock();
    mockDialogConfig = createDynamicDialogConfigMock({ mode: 'admin' });

    mockToastService = createToastServiceMock();

    mockResearchGroupService = {
      createProfessorResearchGroupRequest: vi.fn(() => of({ researchGroupId: 'test-id' } as Partial<ResearchGroupDTO> as ResearchGroupDTO)),
      createResearchGroupAsAdmin: vi.fn(() => of({ researchGroupId: 'admin-test-id' } as Partial<ResearchGroupDTO> as ResearchGroupDTO)),
    } as unknown as ResearchGroupResourceApiService;

    mockProfOnboardingService = {
      confirmOnboarding: vi.fn(() => of(undefined)),
    } as unknown as ProfOnboardingResourceApiService;

    mockSchoolService = {
      getAllSchools: vi.fn(() =>
        of([
          { schoolId: 'school-1', name: 'Test School 1' } as Partial<SchoolShortDTO> as SchoolShortDTO,
          { schoolId: 'school-2', name: 'Test School 2' } as Partial<SchoolShortDTO> as SchoolShortDTO,
        ]),
      ),
    } as unknown as SchoolResourceApiService;

    mockDepartmentService = {
      getDepartments: vi.fn(() =>
        of([
          {
            departmentId: 'dept-1',
            name: 'Test Department 1',
            school: { schoolId: 'school-1' },
          } as Partial<DepartmentDTO> as DepartmentDTO,
          {
            departmentId: 'dept-2',
            name: 'Test Department 2',
            school: { schoolId: 'school-2' },
          } as Partial<DepartmentDTO> as DepartmentDTO,
        ]),
      ),
    } as unknown as DepartmentResourceApiService;

    mockGetCurrentUser = vi.fn(() => of({} as UserShortDTO));
    mockUserService = {
      getCurrentUser: mockGetCurrentUser as unknown as UserResourceApiService['getCurrentUser'],
    } as unknown as UserResourceApiService;
    getAvailableUsersForResearchGroupMock = vi.fn(() => of({ content: [], totalElements: 0 }));

    await TestBed.configureTestingModule({
      imports: [ResearchGroupCreationFormComponent, ReactiveFormsModule],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideToastServiceMock(mockToastService),
        provideDynamicDialogRefMock(mockDialogRef),
        provideDynamicDialogConfigMock(mockDialogConfig),
        provideHttpClientMock(),
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
        { provide: SchoolResourceApiService, useValue: mockSchoolService },
        { provide: DepartmentResourceApiService, useValue: mockDepartmentService },
        { provide: UserResourceApiService, useValue: mockUserService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupCreationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  /**
   * Helper function to fill the form with valid data for admin mode
   * @param overrides - Optional field overrides for specific test scenarios
   */
  function fillValidForm(overrides: Record<string, unknown> = {}): void {
    component.form.patchValue({
      tumID: 'ab12cde',
      researchGroupHead: 'Prof. Dr. Admin Test',
      researchGroupName: 'Admin Research Group',
      departmentId: 'dept-1',
      ...overrides,
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Admin Mode Tests
   * Admins can create research groups directly (ACTIVE state)
   * Personal information fields are disabled in admin mode
   */
  describe('Admin Mode', () => {
    it('should set mode to admin when provided in dialog config', () => {
      expect(component.mode()).toBe('admin');
    });

    it('should not request current user prefill data in admin mode', () => {
      expect(mockGetCurrentUser).not.toHaveBeenCalled();
    });

    it('should disable personal information fields in admin mode', () => {
      expect(component.form.get('title')?.disabled).toBe(true);
      expect(component.form.get('firstName')?.disabled).toBe(true);
      expect(component.form.get('lastName')?.disabled).toBe(true);
      expect(component.form.get('additionalNotes')?.disabled).toBe(true);
    });

    it('should mark form as valid without personal information in admin mode', () => {
      fillValidForm({
        researchGroupHead: 'Prof. Dr. Test',
        researchGroupName: 'Test Research Group',
      });

      expect(component.form.valid).toBe(true);
    });

    it('should call createResearchGroupAsAdmin in admin mode', async () => {
      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createResearchGroupAsAdmin).toHaveBeenCalledOnce();
      expect(mockResearchGroupService.createProfessorResearchGroupRequest).not.toHaveBeenCalled();
    });

    it('should show admin success toast in admin mode', async () => {
      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.adminView.success.create');
    });

    it('should show admin error toast when creation fails in admin mode', async () => {
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ error: 'Creation failed' })),
      );

      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.create');
    });

    it('should handle empty personal fields gracefully in admin mode', async () => {
      fillValidForm({
        title: '',
        firstName: '',
        lastName: '',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createResearchGroupAsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '',
          firstName: '',
          lastName: '',
          universityId: 'ab12cde',
          researchGroupHead: 'Prof. Dr. Admin Test',
          researchGroupName: 'Admin Research Group',
        }),
      );
    });

    it('should close dialog with result after successful admin creation', async () => {
      const expectedResult = { researchGroupId: 'admin-test-id' } as Partial<ResearchGroupDTO> as ResearchGroupDTO;
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() =>
        of(expectedResult),
      ) as unknown as typeof mockResearchGroupService.createResearchGroupAsAdmin;

      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockDialogRef.close).toHaveBeenCalledWith(expectedResult);
    });

    it('should show duplicate name error toast in admin mode when creation fails with 409', async () => {
      const error = new HttpErrorResponse({ status: 409, error: { message: 'Research group already exists' } });
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() => throwError(() => error));

      fillValidForm({
        researchGroupName: 'Duplicate Group',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.duplicateName');
    });

    it('should show user not found error toast in admin mode when TUM-ID is invalid', async () => {
      const error = new HttpErrorResponse({ status: 404, error: { message: 'User with universityId "invalid" not found' } });
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() => throwError(() => error));

      fillValidForm({
        researchGroupHead: 'Prof. Dr. Test',
        researchGroupName: 'Test Group',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10)); // Increase timeout slightly

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.userNotFound');
    });

    it('should show already member error toast in admin mode when user already belongs to a research group', async () => {
      const error = new HttpErrorResponse({
        status: 400,
        error: { message: "User with universityId 'aa00bka' is already a member of research group 'Existing Group'" },
      });
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() => throwError(() => error));

      fillValidForm({
        researchGroupHead: 'Prof. Dr. Test',
        researchGroupName: 'Test Group',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.userAlreadyMember');
    });

    it('should handle non-HttpErrorResponse errors in admin mode', async () => {
      const error = new TypeError('Unexpected error'); // Not an HttpErrorResponse
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() => throwError(() => error));

      fillValidForm({
        researchGroupHead: 'Prof. Dr. Test',
        researchGroupName: 'Test Group',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.create');
    });

    it('should not call confirmOnboarding in admin mode', async () => {
      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockProfOnboardingService.confirmOnboarding).not.toHaveBeenCalled();
    });

    it('should set isSubmitting to true during submission in admin mode', () => {
      fillValidForm();

      component.onConfirmSubmit();

      expect(component.isSubmitting()).toBe(true);
    });

    it('should set isSubmitting to false after successful submission in admin mode', async () => {
      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.isSubmitting()).toBe(false);
    });

    it('should set isSubmitting to false after failed submission in admin mode', async () => {
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ error: 'Creation failed' })),
      );

      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.isSubmitting()).toBe(false);
    });

    it('should not close dialog when submission fails in admin mode', async () => {
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ error: 'Creation failed' })),
      );

      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not submit when form is invalid in admin mode', () => {
      fillValidForm({
        tumID: '', // Make form invalid
      });

      component.onConfirmSubmit();

      expect(mockResearchGroupService.createResearchGroupAsAdmin).not.toHaveBeenCalled();
    });

    it('should not submit when already submitting in admin mode', () => {
      component.isSubmitting.set(true);

      fillValidForm();

      component.onConfirmSubmit();

      expect(mockResearchGroupService.createResearchGroupAsAdmin).not.toHaveBeenCalled();
    });

    it('should trim whitespace from form values in admin mode', async () => {
      fillValidForm({
        tumID: '  ab12cde  ',
        researchGroupHead: '  Prof. Dr. Admin Test  ',
        researchGroupName: '  Admin Research Group  ',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockResearchGroupService.createResearchGroupAsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          universityId: 'ab12cde',
          researchGroupHead: 'Prof. Dr. Admin Test',
          researchGroupName: 'Admin Research Group',
        }),
      );
    });

    it('should handle null values in optional fields in admin mode', async () => {
      fillValidForm({
        researchGroupAbbreviation: null,
        researchGroupWebsite: null,
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createResearchGroupAsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: '',
          website: '',
        }),
      );
    });

    it('should load admin professor candidates when search query is long enough', async () => {
      (component as unknown as { USE_MOCK_USERS: boolean }).USE_MOCK_USERS = false;

      const candidates: KeycloakUserDTO[] = [
        {
          id: '1d8e3025-cf70-4f7a-b510-e9fbe7f4f123',
          firstName: 'Alice',
          lastName: 'Professor',
          email: 'alice.prof@tum.de',
          universityId: 'ab12cde',
          username: 'alice.prof',
        },
      ];
      getAvailableUsersForResearchGroupMock.mockReturnValue(of({ content: candidates, totalElements: 1 }));

      await component.onAdminProfessorSearch('alice');

      expect(getAvailableUsersForResearchGroupMock).toHaveBeenCalledWith(25, 0, 'alice');
      expect(component.adminProfessorCandidates()).toEqual(candidates);
      expect(component.isLoadingAdminUsers()).toBe(false);
    });

    it('should not call user service when admin search query is too short', async () => {
      await component.onAdminProfessorSearch('al');

      expect(getAvailableUsersForResearchGroupMock).not.toHaveBeenCalled();
      expect(component.adminProfessorCandidates()).toEqual([]);
    });

    it('should show toast when admin professor search fails', async () => {
      (component as unknown as { USE_MOCK_USERS: boolean }).USE_MOCK_USERS = false;

      getAvailableUsersForResearchGroupMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      await component.onAdminProfessorSearch('alice');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.loadUsersFailed');
      expect(component.isLoadingAdminUsers()).toBe(false);
    });

    it('should ignore stale admin professor search responses', async () => {
      (component as unknown as { USE_MOCK_USERS: boolean }).USE_MOCK_USERS = false;

      const firstResponse = new Subject<{ content: KeycloakUserDTO[]; totalElements: number }>();
      const secondResponse = new Subject<{ content: KeycloakUserDTO[]; totalElements: number }>();

      getAvailableUsersForResearchGroupMock
        .mockReturnValueOnce(firstResponse.asObservable())
        .mockReturnValueOnce(secondResponse.asObservable());

      const firstCandidates: KeycloakUserDTO[] = [
        {
          id: '7f8d7f67-84c2-4bf8-89f2-84bbca2e7aa1',
          firstName: 'Old',
          lastName: 'Result',
          email: 'old.result@tum.de',
          universityId: 'ab12cde',
          username: 'old.result',
        },
      ];

      const secondCandidates: KeycloakUserDTO[] = [
        {
          id: '0ea4a5fd-2fd8-4b80-8c84-0bb3674ef6e2',
          firstName: 'New',
          lastName: 'Result',
          email: 'new.result@tum.de',
          universityId: 'cd34efg',
          username: 'new.result',
        },
      ];

      const firstSearchPromise = component.onAdminProfessorSearch('alice');
      const secondSearchPromise = component.onAdminProfessorSearch('alicia');

      secondResponse.next({ content: secondCandidates, totalElements: 1 });
      secondResponse.complete();
      await secondSearchPromise;

      firstResponse.next({ content: firstCandidates, totalElements: 1 });
      firstResponse.complete();
      await firstSearchPromise;

      expect(component.adminProfessorCandidates()).toEqual(secondCandidates);
      expect(component.isLoadingAdminUsers()).toBe(false);
    });

    it('should only show admin professor search errors for latest request', async () => {
      (component as unknown as { USE_MOCK_USERS: boolean }).USE_MOCK_USERS = false;

      const firstResponse = new Subject<{ content: KeycloakUserDTO[]; totalElements: number }>();
      const secondResponse = new Subject<{ content: KeycloakUserDTO[]; totalElements: number }>();

      getAvailableUsersForResearchGroupMock
        .mockReturnValueOnce(firstResponse.asObservable())
        .mockReturnValueOnce(secondResponse.asObservable());

      const secondCandidates: KeycloakUserDTO[] = [
        {
          id: 'bf733186-cf79-4f9d-878b-c183c4f5d6b8',
          firstName: 'Latest',
          lastName: 'Result',
          email: 'latest.result@tum.de',
          universityId: 'ef56ghi',
          username: 'latest.result',
        },
      ];

      const firstSearchPromise = component.onAdminProfessorSearch('alice');
      const secondSearchPromise = component.onAdminProfessorSearch('alicia');

      secondResponse.next({ content: secondCandidates, totalElements: 1 });
      secondResponse.complete();
      await secondSearchPromise;

      firstResponse.error(new HttpErrorResponse({ status: 500 }));
      await firstSearchPromise;

      expect(component.adminProfessorCandidates()).toEqual(secondCandidates);
      expect(mockToastService.showErrorKey).not.toHaveBeenCalledWith('researchGroup.members.toastMessages.loadUsersFailed');
    });

    it('should delay loading spinner until threshold for admin professor search', async () => {
      vi.useFakeTimers();
      (component as unknown as { USE_MOCK_USERS: boolean }).USE_MOCK_USERS = false;

      const response = new Subject<{ content: KeycloakUserDTO[]; totalElements: number }>();
      getAvailableUsersForResearchGroupMock.mockReturnValue(response.asObservable());

      const searchPromise = component.onAdminProfessorSearch('alice');
      expect(component.isLoadingAdminUsers()).toBe(false);

      await vi.advanceTimersByTimeAsync(249);
      expect(component.isLoadingAdminUsers()).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(component.isLoadingAdminUsers()).toBe(true);

      response.next({ content: [], totalElements: 0 });
      response.complete();
      await searchPromise;

      expect(component.isLoadingAdminUsers()).toBe(false);
    });

    it('should set selected admin professor and copy universityId into tumID', () => {
      const selectedProfessor: KeycloakUserDTO = {
        id: '2c4f7b39-102f-4b9a-a1ba-33f3388d7744',
        firstName: 'Bob',
        lastName: 'Professor',
        email: 'bob.prof@tum.de',
        universityId: 'xy34zab',
        username: 'bob.prof',
      };

      component.selectAdminProfessor(selectedProfessor);

      expect(component.selectedAdminProfessor()).toEqual(selectedProfessor);
      expect(component.form.get('tumID')?.value).toBe('xy34zab');
      expect(component.isAdminProfessorSelected(selectedProfessor)).toBe(true);
    });

    it('should clear selected admin professor and reset tumID', () => {
      const selectedProfessor: KeycloakUserDTO = {
        id: 'f4f809f7-9150-4602-9c43-2562ec0d0adf',
        firstName: 'Clara',
        lastName: 'Professor',
        email: 'clara.prof@tum.de',
        universityId: 'cd56efg',
        username: 'clara.prof',
      };

      component.selectAdminProfessor(selectedProfessor);
      component.clearSelectedAdminProfessor();

      expect(component.selectedAdminProfessor()).toBeNull();
      expect(component.form.get('tumID')?.value).toBe('');
      expect(component.adminProfessorCandidates()).toEqual([]);
    });

    it('should submit selected admin professor universityId in payload', async () => {
      const selectedProfessor: KeycloakUserDTO = {
        id: 'a2d43009-9c94-4b61-bf00-c89f02f4f1a2',
        firstName: 'Dana',
        lastName: 'Professor',
        email: 'dana.prof@tum.de',
        universityId: 'mn78opq',
        username: 'dana.prof',
      };

      fillValidForm({ tumID: '' });
      component.selectAdminProfessor(selectedProfessor);

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createResearchGroupAsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          universityId: 'mn78opq',
        }),
      );
    });
  });

  describe('onSchoolChange', () => {
    it('should update selected school and clear department if it does not belong to the new school', () => {
      // Setup: Set a department from school-1
      component.selectedDepartmentId.set('dept-1');
      component.form.patchValue({ departmentId: 'dept-1' });

      // Action: Change school to school-2
      component.onSchoolChange({ value: 'school-2', name: 'Test School 2' });

      // Assert: Department should be cleared since dept-1 belongs to school-1, not school-2
      expect(component.selectedSchoolId()).toBe('school-2');
      expect(component.selectedDepartmentId()).toBeUndefined();
      expect(component.form.get('departmentId')?.value).toBe('');
    });

    it('should update selected school and keep department if it belongs to the new school', () => {
      // Setup: Set a department from school-1
      component.selectedDepartmentId.set('dept-1');
      component.form.patchValue({ departmentId: 'dept-1' });

      // Action: Change school to school-1 (same school)
      component.onSchoolChange({ value: 'school-1', name: 'Test School 1' });

      // Assert: Department should remain since dept-1 belongs to school-1
      expect(component.selectedSchoolId()).toBe('school-1');
      expect(component.selectedDepartmentId()).toBe('dept-1');
      expect(component.form.get('departmentId')?.value).toBe('dept-1');
    });

    it('should update selected school when no department is selected', () => {
      // Setup: No department selected
      component.selectedDepartmentId.set(undefined);

      // Action: Change school
      component.onSchoolChange({ value: 'school-1', name: 'Test School 1' });

      // Assert: School should be updated, no department operations
      expect(component.selectedSchoolId()).toBe('school-1');
      expect(component.selectedDepartmentId()).toBeUndefined();
    });

    it('should update selected school when department is empty string', () => {
      // Setup: Empty department string
      component.selectedDepartmentId.set('');

      // Action: Change school
      component.onSchoolChange({ value: 'school-1', name: 'Test School 1' });

      // Assert: School should be updated, no department operations
      expect(component.selectedSchoolId()).toBe('school-1');
      expect(component.selectedDepartmentId()).toBe('');
    });
  });

  describe('onDepartmentChange', () => {
    it('should update selected department and auto-update school filter', () => {
      // Setup: Start with no selections
      component.selectedDepartmentId.set(undefined);
      component.selectedSchoolId.set(undefined);

      // Action: Select dept-1 which belongs to school-1
      component.onDepartmentChange({ value: 'dept-1', name: 'Test Department 1' });

      // Assert: Both department and school should be updated
      expect(component.selectedDepartmentId()).toBe('dept-1');
      expect(component.form.get('departmentId')?.value).toBe('dept-1');
      expect(component.selectedSchoolId()).toBe('school-1');
    });

    it('should update selected department to a different school', () => {
      // Setup: Start with school-1 selected
      component.selectedSchoolId.set('school-1');

      // Action: Select dept-2 which belongs to school-2
      component.onDepartmentChange({ value: 'dept-2', name: 'Test Department 2' });

      // Assert: School should auto-update to school-2
      expect(component.selectedDepartmentId()).toBe('dept-2');
      expect(component.selectedSchoolId()).toBe('school-2');
    });

    it('should handle department with no school gracefully', () => {
      // Setup: Add a department without school to the list
      component.departments.set([
        {
          departmentId: 'dept-no-school',
          name: 'Department Without School',
        } as Partial<DepartmentDTO> as DepartmentDTO,
      ]);

      // Action: Select department without school
      component.onDepartmentChange({ value: 'dept-no-school', name: 'Department Without School' });

      // Assert: Department should be set, school should remain unchanged
      expect(component.selectedDepartmentId()).toBe('dept-no-school');
      expect(component.form.get('departmentId')?.value).toBe('dept-no-school');
    });

    it('should handle department with empty school string', () => {
      // Setup: Add a department with empty school string
      component.departments.set([
        {
          departmentId: 'dept-empty-school',
          name: 'Department With Empty School',
          school: { schoolId: '' },
        } as Partial<DepartmentDTO> as DepartmentDTO,
      ]);

      // Action: Select department with empty school
      component.onDepartmentChange({ value: 'dept-empty-school', name: 'Department With Empty School' });

      // Assert: Department should be set, school should not be updated to empty string
      expect(component.selectedDepartmentId()).toBe('dept-empty-school');
      expect(component.form.get('departmentId')?.value).toBe('dept-empty-school');
    });
  });

  describe('onCancel', () => {
    it('should close dialog when cancel is clicked in admin mode', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });
  });
});

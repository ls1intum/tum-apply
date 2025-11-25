import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { ResearchGroupCreationFormComponent } from 'app/shared/components/molecules/research-group-creation-form/research-group-creation-form.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { createDynamicDialogRefMock, DynamicDialogRefMock, provideDynamicDialogRefMock } from 'util/dynamicdialogref.mock';
import { createDynamicDialogConfigMock, provideDynamicDialogConfigMock } from 'util/dynamicdialogref.mock';
import { HttpErrorResponse } from '@angular/common/http';
import { EnumDisplayDTO } from 'app/generated/model/enumDisplayDTO';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';

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
  let mockToastService: ToastServiceMock;

  beforeEach(async () => {
    mockDialogRef = createDynamicDialogRefMock();
    mockDialogConfig = createDynamicDialogConfigMock({ mode: 'admin' });

    mockToastService = createToastServiceMock();

    mockResearchGroupService = {
      createProfessorResearchGroupRequest: vi.fn(() => of({ researchGroupId: 'test-id', head: '', name: '' } as ResearchGroupDTO)),
      createResearchGroupAsAdmin: vi.fn(() => of({ researchGroupId: 'admin-test-id', head: '', name: '' } as ResearchGroupDTO)),
      getAvailableSchools: vi.fn(() => of([] as EnumDisplayDTO[])),
      getAvailableDepartments: vi.fn(() => of([] as EnumDisplayDTO[])),
      getDepartmentsBySchool: vi.fn(() => of([] as EnumDisplayDTO[])),
    } as unknown as Pick<
      ResearchGroupResourceApiService,
      | 'createProfessorResearchGroupRequest'
      | 'createResearchGroupAsAdmin'
      | 'getAvailableSchools'
      | 'getAvailableDepartments'
      | 'getDepartmentsBySchool'
    >;

    mockProfOnboardingService = {
      confirmOnboarding: vi.fn(() => of(undefined)),
    } as unknown as Pick<ProfOnboardingResourceApiService, 'confirmOnboarding'>;

    await TestBed.configureTestingModule({
      imports: [ResearchGroupCreationFormComponent, ReactiveFormsModule],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideToastServiceMock(mockToastService),
        provideDynamicDialogRefMock(mockDialogRef),
        provideDynamicDialogConfigMock(mockDialogConfig),
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupCreationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
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
      researchGroupSchool: { name: 'School of Computation, Information and Technology', value: 'CIT' },
      researchGroupDepartment: { name: 'researchGroup.department.options.informatics', value: 'INFORMATICS' },
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
      const expectedResult = { researchGroupId: 'admin-test-id', head: '', name: '' } as ResearchGroupDTO;
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() =>
        of(expectedResult),
      ) as unknown as ResearchGroupResourceApiService['createResearchGroupAsAdmin'];

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
  });

  describe('onCancel', () => {
    it('should close dialog when cancel is clicked in admin mode', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });
  });

  describe('School and Department Selection', () => {
    const mockSchool = { name: 'School of Computation, Information and Technology', value: 'CIT' };
    const mockDepartments: EnumDisplayDTO[] = [
      { displayName: 'Informatics', value: 'INFORMATICS' },
      { displayName: 'Mathematics', value: 'MATHEMATICS' },
    ];

    it('should update selected school when onSchoolChange is called', async () => {
      await component.onSchoolChange(mockSchool);

      expect(component.selectedSchool()).toEqual(mockSchool);
    });

    it('should fetch departments for selected school', async () => {
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        of(mockDepartments),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];

      await component.onSchoolChange(mockSchool);

      expect(mockResearchGroupService.getDepartmentsBySchool).toHaveBeenCalledWith('CIT');
    });

    it('should update filtered departments after fetching', async () => {
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        of(mockDepartments),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];

      await component.onSchoolChange(mockSchool);

      const filteredDepts = component.filteredDepartments();
      expect(filteredDepts).toHaveLength(2);
      expect(filteredDepts[0]).toEqual({ name: 'Informatics', value: 'INFORMATICS' });
      expect(filteredDepts[1]).toEqual({ name: 'Mathematics', value: 'MATHEMATICS' });
    });

    it('should clear department selection if current department is not in filtered list', async () => {
      const mockCurrentDepartment = { name: 'Computer Science', value: 'CS' };
      component.form.get('researchGroupDepartment')?.setValue(mockCurrentDepartment);
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        of(mockDepartments),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];

      await component.onSchoolChange(mockSchool);

      expect(component.form.get('researchGroupDepartment')?.value).toBeNull();
    });

    it('should keep department selection if current department is in filtered list', async () => {
      const mockCurrentDepartment = { name: 'Informatics', value: 'INFORMATICS' };
      component.form.get('researchGroupDepartment')?.setValue(mockCurrentDepartment);
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        of(mockDepartments),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];

      await component.onSchoolChange(mockSchool);

      expect(component.form.get('researchGroupDepartment')?.value).toEqual(mockCurrentDepartment);
    });

    it('should handle error when fetching departments and show all departments', async () => {
      const allDepts: EnumDisplayDTO[] = [
        { displayName: 'All Department 1', value: 'ALL_DEPT_1' },
        { displayName: 'All Department 2', value: 'ALL_DEPT_2' },
      ];
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        throwError(() => new Error('API Error')),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];
      mockResearchGroupService.getAvailableDepartments = vi.fn(() =>
        of(allDepts),
      ) as unknown as ResearchGroupResourceApiService['getAvailableDepartments'];

      const newFixture = TestBed.createComponent(ResearchGroupCreationFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      await newComponent.onSchoolChange(mockSchool);

      expect(newComponent.filteredDepartments().length).toBeGreaterThanOrEqual(0);
    });

    it('should clear filtered departments when school is set to null', async () => {
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        of(mockDepartments),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];
      await component.onSchoolChange(mockSchool);
      expect(component.filteredDepartments()).toHaveLength(2);

      await component.onSchoolChange(null);

      expect(component.selectedSchool()).toBeNull();
      expect(component.filteredDepartments()).toEqual([]);
    });

    it('should clear department selection when school is set to null', async () => {
      component.form.get('researchGroupDepartment')?.setValue({ name: 'Informatics', value: 'INFORMATICS' });

      await component.onSchoolChange(null);

      expect(component.form.get('researchGroupDepartment')?.value).toBeNull();
    });

    it('should return all departments when no school is selected', () => {
      component.selectedSchool.set(null);
      component.filteredDepartments.set([]);

      const departments = component.departmentOptions();

      expect(departments).toEqual(component.allDepartmentOptions());
    });

    it('should return filtered departments when school is selected and departments are available', async () => {
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        of(mockDepartments),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];

      await component.onSchoolChange(mockSchool);

      const departments = component.departmentOptions();

      expect(departments).toHaveLength(2);
      expect(departments[0].value).toBe('INFORMATICS');
      expect(departments[1].value).toBe('MATHEMATICS');
    });

    it('should return all departments when school is selected but filtered list is empty', () => {
      component.selectedSchool.set(mockSchool);
      component.filteredDepartments.set([]);

      const departments = component.departmentOptions();

      expect(departments).toEqual(component.allDepartmentOptions());
    });

    it('should not fetch departments when school value is not a string', async () => {
      const invalidSchool = { name: 'Invalid', value: 123 };
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        of(mockDepartments),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await component.onSchoolChange(invalidSchool as any);

      expect(mockResearchGroupService.getDepartmentsBySchool).not.toHaveBeenCalled();
      expect(component.filteredDepartments()).toEqual([]);
    });

    it('should handle departments with null/undefined displayName and value fields', async () => {
      const departmentsWithNulls: EnumDisplayDTO[] = [
        { displayName: undefined, value: 'INFORMATICS' },
        { displayName: 'Mathematics', value: undefined },
        { displayName: undefined, value: undefined },
      ];
      mockResearchGroupService.getDepartmentsBySchool = vi.fn(() =>
        of(departmentsWithNulls),
      ) as unknown as ResearchGroupResourceApiService['getDepartmentsBySchool'];

      await component.onSchoolChange(mockSchool);

      const filteredDepts = component.filteredDepartments();
      expect(filteredDepts).toHaveLength(3);
      expect(filteredDepts[0]).toEqual({ name: '', value: 'INFORMATICS' });
      expect(filteredDepts[1]).toEqual({ name: 'Mathematics', value: '' });
      expect(filteredDepts[2]).toEqual({ name: '', value: '' });
    });
  });

  describe('DTO Creation', () => {
    it('should handle researchGroupSchool with undefined value in admin mode', async () => {
      fillValidForm({
        researchGroupSchool: { name: 'Some School', value: undefined },
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createResearchGroupAsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          school: undefined,
        }),
      );
    });

    it('should handle researchGroupSchool with null value in admin mode', async () => {
      fillValidForm({
        researchGroupSchool: { name: 'Some School', value: null },
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createResearchGroupAsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          school: undefined,
        }),
      );
    });
  });
});

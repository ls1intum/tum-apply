import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { ResearchGroupCreationFormComponent } from 'app/shared/components/molecules/research-group-creation-form/research-group-creation-form.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { SchoolResourceApiService } from 'app/generated/api/schoolResourceApi.service';
import { DepartmentResourceApiService } from 'app/generated/api/departmentResourceApi.service';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { SchoolShortDTO } from 'app/generated/model/schoolShortDTO';
import { DepartmentDTO } from 'app/generated/model/departmentDTO';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { createDynamicDialogRefMock, DynamicDialogRefMock, provideDynamicDialogRefMock } from 'util/dynamicdialogref.mock';
import { createDynamicDialogConfigMock, provideDynamicDialogConfigMock } from 'util/dynamicdialogref.mock';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientMock } from 'util/http-client.mock';

/**
 * Test suite for ResearchGroupCreationFormComponent - Professor Mode
 * Tests professor-specific functionality for creating research group requests
 * Professors create research group requests (DRAFT state) that require admin approval
 */
describe('ResearchGroupCreationFormComponent - Professor Mode', () => {
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
  let mockToastService: ToastServiceMock;

  beforeEach(async () => {
    mockDialogRef = createDynamicDialogRefMock();
    mockDialogConfig = createDynamicDialogConfigMock({ mode: 'professor' });

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

    await TestBed.configureTestingModule({
      imports: [ResearchGroupCreationFormComponent, ReactiveFormsModule],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideHttpClientMock(),
        provideToastServiceMock(mockToastService),
        provideDynamicDialogRefMock(mockDialogRef),
        provideDynamicDialogConfigMock(mockDialogConfig),
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
    vi.clearAllMocks();
  });

  /**
   * Helper function to fill the form with valid data
   * @param overrides - Optional field overrides for specific test scenarios
   */
  function fillValidForm(overrides: Record<string, unknown> = {}): void {
    component.form.patchValue({
      title: 'Prof.',
      firstName: 'Max',
      lastName: 'Mustermann',
      tumID: 'ab12cde',
      researchGroupHead: 'Prof. Dr. Max Mustermann',
      researchGroupName: 'AI Research Group',
      departmentId: 'dept-1',
      ...overrides,
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Form Initialization Tests
   * Verifies that all form controls are properly created with correct initial states
   */
  describe('Form Initialization', () => {
    it('should request current user data for professor prefill', () => {
      expect(mockGetCurrentUser).toHaveBeenCalledOnce();
    });

    it('should initialize with all required form fields', () => {
      expect(component.form.get('title')).toBeTruthy();
      expect(component.form.get('firstName')).toBeTruthy();
      expect(component.form.get('lastName')).toBeTruthy();
      expect(component.form.get('tumID')).toBeTruthy();
      expect(component.form.get('researchGroupHead')).toBeTruthy();
      expect(component.form.get('researchGroupName')).toBeTruthy();
    });

    it('should initialize form with empty values', () => {
      expect(component.form.get('title')?.value).toBe('');
      expect(component.form.get('firstName')?.value).toBe('');
      expect(component.form.get('lastName')?.value).toBe('');
    });

    it('should prefill professor fields from current user data', async () => {
      mockGetCurrentUser.mockReturnValue(
        of({
          firstName: 'Anna',
          lastName: 'Muster',
          email: 'anna.muster@tum.de',
          universityId: 'ab12cde',
        } as UserShortDTO),
      );

      await (component as any).prefillProfessorData();

      expect(component.form.get('firstName')?.value).toBe('Anna');
      expect(component.form.get('lastName')?.value).toBe('Muster');
      expect(component.form.get('tumID')?.value).toBe('ab12cde');
      expect(component.form.get('researchGroupHead')?.value).toBe('Anna Muster');
      expect(component.form.get('researchGroupContactEmail')?.value).toBe('anna.muster@tum.de');
    });

    it('should not overwrite already entered values when prefilling', async () => {
      component.form.patchValue({
        firstName: 'ManualFirst',
        lastName: 'ManualLast',
        tumID: 'zz99zzz',
        researchGroupHead: 'Manual Head',
        researchGroupContactEmail: 'manual@tum.de',
      });

      mockGetCurrentUser.mockReturnValue(
        of({
          firstName: 'PrefilledFirst',
          lastName: 'PrefilledLast',
          email: 'prefilled@tum.de',
          universityId: 'ab12cde',
        } as UserShortDTO),
      );

      await (component as any).prefillProfessorData();

      expect(component.form.get('firstName')?.value).toBe('ManualFirst');
      expect(component.form.get('lastName')?.value).toBe('ManualLast');
      expect(component.form.get('tumID')?.value).toBe('zz99zzz');
      expect(component.form.get('researchGroupHead')?.value).toBe('Manual Head');
      expect(component.form.get('researchGroupContactEmail')?.value).toBe('manual@tum.de');
    });

    it('should mark required fields as invalid when empty', () => {
      const titleControl = component.form.get('title');
      const firstNameControl = component.form.get('firstName');
      const lastNameControl = component.form.get('lastName');
      const tumIDControl = component.form.get('tumID');

      expect(titleControl?.valid).toBe(false);
      expect(firstNameControl?.valid).toBe(false);
      expect(lastNameControl?.valid).toBe(false);
      expect(tumIDControl?.valid).toBe(false);
    });

    it('should mark optional fields as valid when empty', () => {
      const abbreviationControl = component.form.get('researchGroupAbbreviation');
      const websiteControl = component.form.get('researchGroupWebsite');

      expect(abbreviationControl?.valid).toBe(true);
      expect(websiteControl?.valid).toBe(true);
    });
  });

  /**
   * Form Validation Tests
   * Tests email validation, max length constraints, and TUM ID format
   */
  describe('Form Validation', () => {
    it('should validate email format for contact email', () => {
      const emailControl = component.form.get('researchGroupContactEmail');

      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBe(false);

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should enforce max length on description field', () => {
      const descriptionControl = component.form.get('researchGroupDescription');
      const longText = 'a'.repeat(1001);

      descriptionControl?.setValue(longText);
      expect(descriptionControl?.hasError('maxlength')).toBe(true);

      descriptionControl?.setValue('a'.repeat(1000));
      expect(descriptionControl?.valid).toBe(true);
    });

    it('should validate TUM ID format', () => {
      const tumIDControl = component.form.get('tumID');

      tumIDControl?.setValue('invalid');
      expect(tumIDControl?.valid).toBe(false);

      tumIDControl?.setValue('ab12cde');
      expect(tumIDControl?.valid).toBe(true);
    });

    it('should validate form as valid when all required fields are filled', () => {
      fillValidForm();

      expect(component.form.valid).toBe(true);
    });
  });

  /**
   * Form Submission Tests
   * Tests the onSubmit method which triggers the confirmation dialog
   */
  describe('onSubmit', () => {
    it('should not submit when form is invalid', () => {
      const mockDialog = component.confirmDialog();
      if (mockDialog) {
        const confirmDialogSpy = vi.spyOn(mockDialog, 'confirm');

        component.onSubmit();

        expect(confirmDialogSpy).not.toHaveBeenCalled();
      } else {
        component.onSubmit();
        // If no dialog, just ensure no errors are thrown
        expect(true).toBe(true);
      }
    });

    it('should trigger confirm dialog when form is valid', () => {
      fillValidForm();

      const mockConfirmDialog = { confirm: vi.fn() } as Partial<ConfirmDialog> as ConfirmDialog;
      vi.spyOn(component, 'confirmDialog').mockReturnValue(mockConfirmDialog);

      component.onSubmit();

      expect(mockConfirmDialog.confirm).toHaveBeenCalledOnce();
    });
  });

  /**
   * Confirmed Submission Tests
   * Tests actual submission after user confirms in dialog
   * Includes data transformation, trimming, and API calls
   */
  describe('onConfirmSubmit', () => {
    beforeEach(() => {
      fillValidForm();
    });

    it('should not submit when form is invalid', () => {
      component.form.patchValue({ title: '' }); // Make form invalid

      component.onConfirmSubmit();

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).not.toHaveBeenCalled();
    });

    it('should not submit when already submitting', () => {
      component.isSubmitting.set(true);

      component.onConfirmSubmit();

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).not.toHaveBeenCalled();
    });

    it('should call research group service with correct data', async () => {
      fillValidForm({ researchGroupAbbreviation: 'AIRG' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Prof.',
          firstName: 'Max',
          lastName: 'Mustermann',
          universityId: 'ab12cde',
          researchGroupHead: 'Prof. Dr. Max Mustermann',
          researchGroupName: 'AI Research Group',
          abbreviation: 'AIRG',
        }),
      );
    });

    it('should trim whitespace from form values', async () => {
      fillValidForm({
        title: '  Prof.  ',
        firstName: '  Max  ',
        lastName: '  Mustermann  ',
        tumID: '  ab12cde  ',
        researchGroupHead: '  Prof. Dr. Max Mustermann  ',
        researchGroupName: '  AI Research Group  ',
      });

      // Ensure form is valid
      expect(component.form.valid).toBe(true);

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Prof.',
          firstName: 'Max',
          lastName: 'Mustermann',
          universityId: 'ab12cde',
          researchGroupHead: 'Prof. Dr. Max Mustermann',
          researchGroupName: 'AI Research Group',
        }),
      );
    });

    it('should convert empty optional fields to empty strings', async () => {
      fillValidForm({
        researchGroupAbbreviation: '',
        researchGroupWebsite: '',
        researchGroupCity: '',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: '',
          website: '',
          city: '',
        }),
      );
    });

    it('should handle non-string values in optional fields', async () => {
      fillValidForm({
        researchGroupWebsite: 12345,
        researchGroupAbbreviation: { some: 'object' },
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          website: '',
          abbreviation: '',
        }),
      );
    });

    it('should set isSubmitting to true during submission', () => {
      component.onConfirmSubmit();

      expect(component.isSubmitting()).toBe(true);
    });

    it('should call confirmOnboarding after successful research group creation', async () => {
      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockProfOnboardingService.confirmOnboarding).toHaveBeenCalledOnce();
    });

    it('should show success toast after successful submission', async () => {
      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('onboarding.professorRequest.success');
    });

    it('should close dialog after successful submission', async () => {
      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockDialogRef.close).toHaveBeenCalledWith({ researchGroupId: 'test-id' });
    });

    it('should set isSubmitting to false after successful submission', async () => {
      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.isSubmitting()).toBe(false);
    });
  });

  /**
   * Error Handling Tests
   * Verifies proper error messages for different error scenarios including:
   * - Duplicate research group names (409)
   * - Invalid TUM-IDs (404)
   * - Generic errors
   * - Non-HTTP errors
   */
  describe('Error Handling', () => {
    beforeEach(() => {
      fillValidForm();
    });

    it('should show error toast when research group creation fails', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ error: 'API Error' })),
      );

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.professorRequest.error');
    });

    it('should not close dialog when submission fails', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ error: 'API Error' })),
      );

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should set isSubmitting to false after failed submission', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ error: 'API Error' })),
      );

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.isSubmitting()).toBe(false);
    });

    it('should not call confirmOnboarding when research group creation fails', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ error: 'API Error' })),
      );

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockProfOnboardingService.confirmOnboarding).not.toHaveBeenCalled();
    });

    it('should show duplicate name error toast when creation fails with 409 status', async () => {
      const error = new HttpErrorResponse({ status: 409, error: { message: 'Research group already exists' } });
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => error));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.professorRequest.errorDuplicateName');
    });

    it('should show duplicate name error toast when error message includes "already exists"', async () => {
      const error = new HttpErrorResponse({ status: 500, error: { message: 'Research group already exists in database' } });
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => error));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.professorRequest.errorDuplicateName');
    });

    it('should show user not found error toast when creation fails with 404 status', async () => {
      const error = new HttpErrorResponse({ status: 404, error: { message: 'User with universityId "ab12abc" not found' } });
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => error));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.professorRequest.errorUserNotFound');
    });

    it('should handle HttpErrorResponse without error.message property', async () => {
      const error = new HttpErrorResponse({ status: 500 }); // No error.message
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => error));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.professorRequest.error');
    });

    it('should handle non-HttpErrorResponse errors in professor mode', async () => {
      const error = new Error('Network error'); // Not an HttpErrorResponse
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => error));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.professorRequest.error');
    });
  });

  describe('onCancel', () => {
    it('should close dialog when cancel is clicked', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });
  });

  /**
   * Edge Cases Tests
   * Tests handling of null/undefined values, missing dependencies, and edge scenarios
   */
  describe('Edge Cases', () => {
    it('should handle missing dialog ref gracefully', () => {
      // Create a separate TestBed configuration for this specific test
      const mockDialogRefNull = null;

      const fixtureNoRef = TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [ResearchGroupCreationFormComponent, ReactiveFormsModule],
          providers: [
            provideTranslateMock(),
            provideFontAwesomeTesting(),
            provideHttpClientMock(),
            { provide: DynamicDialogRef, useValue: mockDialogRefNull },
            { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
            { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
            { provide: ToastService, useValue: mockToastService },
          ],
        })
        .createComponent(ResearchGroupCreationFormComponent);

      const componentNoRef = fixtureNoRef.componentInstance;

      expect(() => componentNoRef.onCancel()).not.toThrow();
    });

    it('should handle null values in optional fields', async () => {
      fillValidForm({
        researchGroupAbbreviation: null,
        researchGroupWebsite: null,
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: '',
          website: '',
        }),
      );
    });

    it('should handle undefined values in optional fields', async () => {
      fillValidForm({
        researchGroupAbbreviation: undefined,
        researchGroupContactEmail: undefined,
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: '',
          contactEmail: '',
        }),
      );
    });

    it('should handle whitespace-only values in optional fields', async () => {
      fillValidForm({
        researchGroupAbbreviation: '   ',
        researchGroupWebsite: '  ',
        researchGroupCity: '    ',
        researchGroupDescription: '\t\n',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: '',
          website: '',
          city: '',
          description: '',
        }),
      );
    });
  });

  /**
   * Loading State Tests
   * Verifies isSubmitting signal prevents duplicate submissions
   */
  describe('Loading State', () => {
    it('should initialize with isSubmitting as false', () => {
      expect(component.isSubmitting()).toBe(false);
    });

    it('should prevent multiple simultaneous submissions', () => {
      fillValidForm();
      component.isSubmitting.set(true);

      component.onConfirmSubmit();

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).not.toHaveBeenCalled();
    });
  });

  /**
   * Professor Mode Specific Tests
   * Professors create research group requests (DRAFT state) that require admin approval
   */
  describe('Professor Mode', () => {
    it('should set mode to professor by default', () => {
      expect(component.mode()).toBe('professor');
    });

    it('should enable personal information fields in professor mode', () => {
      expect(component.form.get('title')?.disabled).toBe(false);
      expect(component.form.get('firstName')?.disabled).toBe(false);
      expect(component.form.get('lastName')?.disabled).toBe(false);
      expect(component.form.get('additionalNotes')?.disabled).toBe(false);
    });

    it('should require tumID validation in professor mode', () => {
      const tumIDControl = component.form.get('tumID');

      tumIDControl?.setValue('');
      expect(tumIDControl?.valid).toBe(false);

      tumIDControl?.setValue('invalid-format');
      expect(tumIDControl?.valid).toBe(false);

      tumIDControl?.setValue('ab12cde');
      expect(tumIDControl?.valid).toBe(true);
    });

    it('should call createProfessorResearchGroupRequest in professor mode', async () => {
      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledOnce();
      expect(mockResearchGroupService.createResearchGroupAsAdmin).not.toHaveBeenCalled();
    });

    it('should call confirmOnboarding in professor mode', async () => {
      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockProfOnboardingService.confirmOnboarding).toHaveBeenCalledOnce();
    });

    it('should show professor success toast in professor mode', async () => {
      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('onboarding.professorRequest.success');
    });

    it('should show professor error toast when creation fails in professor mode', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() =>
        throwError(() => new HttpErrorResponse({ error: 'Creation failed' })),
      );

      fillValidForm();

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.professorRequest.error');
    });
  });

  /**
   * Mode Switching Tests
   * Tests dynamic mode determination based on dialog config
   */
  describe('Mode Switching', () => {
    it('should default to professor mode when no config is provided', () => {
      // Create component without dialog config
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ResearchGroupCreationFormComponent],
        providers: [
          provideTranslateMock(),
          provideFontAwesomeTesting(),
          provideHttpClientMock(),
          provideToastServiceMock(mockToastService),
          provideDynamicDialogRefMock(mockDialogRef),
          { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
          { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
        ],
      });

      const newFixture = TestBed.createComponent(ResearchGroupCreationFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.mode()).toBe('professor');
    });

    it('should use mode from dialog config data', () => {
      mockDialogConfig.data = { mode: 'admin' };

      const newFixture = TestBed.createComponent(ResearchGroupCreationFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.mode()).toBe('admin');
    });
  });
});

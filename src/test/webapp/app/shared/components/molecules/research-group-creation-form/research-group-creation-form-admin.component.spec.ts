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
      createProfessorResearchGroupRequest: vi.fn(() => of({ researchGroupId: 'test-id' } as any)),
      createResearchGroupAsAdmin: vi.fn(() => of({ researchGroupId: 'admin-test-id' } as any)),
    };

    mockProfOnboardingService = {
      confirmOnboarding: vi.fn(() => of(undefined)) as any,
    };

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
      const expectedResult = { researchGroupId: 'admin-test-id' };
      mockResearchGroupService.createResearchGroupAsAdmin = vi.fn(() => of(expectedResult as any));

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
});

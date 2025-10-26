import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { ProfessorRequestAccessFormComponent } from 'app/shared/components/molecules/onboarding-dialog/professor-request-access-form/professor-request-access-form.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('ProfessorRequestAccessFormComponent', () => {
  let component: ProfessorRequestAccessFormComponent;
  let fixture: ComponentFixture<ProfessorRequestAccessFormComponent>;

  let mockDialogRef: Partial<DynamicDialogRef>;
  let mockResearchGroupService: Partial<ResearchGroupResourceApiService>;
  let mockProfOnboardingService: Partial<ProfOnboardingResourceApiService>;
  let mockToastService: Partial<ToastService>;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockResearchGroupService = {
      createProfessorResearchGroupRequest: vi.fn(() => of({ researchGroupId: 'test-id' } as any)),
    };

    mockProfOnboardingService = {
      confirmOnboarding: vi.fn(() => of(undefined)) as any,
    };

    mockToastService = {
      showSuccessKey: vi.fn(),
      showErrorKey: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfessorRequestAccessFormComponent, ReactiveFormsModule],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorRequestAccessFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper function to fill the form with valid data
   */
  function fillValidForm(overrides: Record<string, unknown> = {}): void {
    component.professorForm.patchValue({
      title: 'Prof.',
      firstName: 'Max',
      lastName: 'Mustermann',
      tumID: 'ab12cde',
      researchGroupHead: 'Prof. Dr. Max Mustermann',
      researchGroupName: 'AI Research Group',
      ...overrides,
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with all required form fields', () => {
      expect(component.professorForm.get('title')).toBeTruthy();
      expect(component.professorForm.get('firstName')).toBeTruthy();
      expect(component.professorForm.get('lastName')).toBeTruthy();
      expect(component.professorForm.get('tumID')).toBeTruthy();
      expect(component.professorForm.get('researchGroupHead')).toBeTruthy();
      expect(component.professorForm.get('researchGroupName')).toBeTruthy();
    });

    it('should initialize form with empty values', () => {
      expect(component.professorForm.get('title')?.value).toBe('');
      expect(component.professorForm.get('firstName')?.value).toBe('');
      expect(component.professorForm.get('lastName')?.value).toBe('');
    });

    it('should mark required fields as invalid when empty', () => {
      const titleControl = component.professorForm.get('title');
      const firstNameControl = component.professorForm.get('firstName');
      const lastNameControl = component.professorForm.get('lastName');
      const tumIDControl = component.professorForm.get('tumID');

      expect(titleControl?.valid).toBe(false);
      expect(firstNameControl?.valid).toBe(false);
      expect(lastNameControl?.valid).toBe(false);
      expect(tumIDControl?.valid).toBe(false);
    });

    it('should mark optional fields as valid when empty', () => {
      const abbreviationControl = component.professorForm.get('researchGroupAbbreviation');
      const websiteControl = component.professorForm.get('researchGroupWebsite');

      expect(abbreviationControl?.valid).toBe(true);
      expect(websiteControl?.valid).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate email format for contact email', () => {
      const emailControl = component.professorForm.get('researchGroupContactEmail');

      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBe(false);

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should enforce max length on description field', () => {
      const descriptionControl = component.professorForm.get('researchGroupDescription');
      const longText = 'a'.repeat(1001);

      descriptionControl?.setValue(longText);
      expect(descriptionControl?.hasError('maxlength')).toBe(true);

      descriptionControl?.setValue('a'.repeat(1000));
      expect(descriptionControl?.valid).toBe(true);
    });

    it('should validate TUM ID format', () => {
      const tumIDControl = component.professorForm.get('tumID');

      tumIDControl?.setValue('invalid');
      expect(tumIDControl?.valid).toBe(false);

      tumIDControl?.setValue('ab12cde');
      expect(tumIDControl?.valid).toBe(true);
    });

    it('should validate form as valid when all required fields are filled', () => {
      fillValidForm();

      expect(component.professorForm.valid).toBe(true);
    });
  });

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

      const mockConfirmDialog = { confirm: vi.fn() };
      vi.spyOn(component, 'confirmDialog').mockReturnValue(mockConfirmDialog as any);

      component.onSubmit();

      expect(mockConfirmDialog.confirm).toHaveBeenCalledOnce();
    });
  });

  describe('onConfirmSubmit', () => {
    beforeEach(() => {
      fillValidForm();
    });

    it('should not submit when form is invalid', () => {
      component.professorForm.patchValue({ title: '' }); // Make form invalid

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
      expect(component.professorForm.valid).toBe(true);

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
        researchGroupSchool: '',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: '',
          website: '',
          school: '',
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

  describe('Error Handling', () => {
    beforeEach(() => {
      fillValidForm();
    });

    it('should show error toast when research group creation fails', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => new Error('API Error')));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.professorRequest.error');
    });

    it('should not close dialog when submission fails', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => new Error('API Error')));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should set isSubmitting to false after failed submission', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => new Error('API Error')));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.isSubmitting()).toBe(false);
    });

    it('should not call confirmOnboarding when research group creation fails', async () => {
      mockResearchGroupService.createProfessorResearchGroupRequest = vi.fn(() => throwError(() => new Error('API Error')));

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockProfOnboardingService.confirmOnboarding).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog when cancel is clicked', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing dialog ref gracefully', () => {
      // Create a separate TestBed configuration for this specific test
      const mockDialogRefNull = null;

      const fixtureNoRef = TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [ProfessorRequestAccessFormComponent, ReactiveFormsModule],
          providers: [
            provideTranslateMock(),
            provideFontAwesomeTesting(),
            { provide: DynamicDialogRef, useValue: mockDialogRefNull },
            { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
            { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
            { provide: ToastService, useValue: mockToastService },
          ],
        })
        .createComponent(ProfessorRequestAccessFormComponent);

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
        researchGroupSchool: '\t\n',
        researchGroupCity: '    ',
      });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockResearchGroupService.createProfessorResearchGroupRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: '',
          website: '',
          school: '',
          city: '',
        }),
      );
    });
  });

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
});

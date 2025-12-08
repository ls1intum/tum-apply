import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { EmployeeRequestAccessFormComponent } from 'app/shared/components/molecules/onboarding-dialog/employee-request-access-form/employee-request-access-form.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { createDialogServiceMock, DialogServiceMock, provideDialogServiceMock } from 'util/dialog.service.mock';
import { createDynamicDialogRefMock, DynamicDialogRefMock, provideDynamicDialogRefMock } from 'util/dynamicdialogref.mock';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { OnboardingDialog } from 'app/shared/components/molecules/onboarding-dialog/onboarding-dialog';
import { ToastService } from 'app/service/toast-service';

describe('EmployeeRequestAccessFormComponent', () => {
  let component: EmployeeRequestAccessFormComponent;
  let fixture: ComponentFixture<EmployeeRequestAccessFormComponent>;

  let mockDialogRef: DynamicDialogRefMock;
  let mockDialogService: DialogServiceMock;
  let mockResearchGroupService: Partial<ResearchGroupResourceApiService>;
  let mockProfOnboardingService: Partial<ProfOnboardingResourceApiService>;
  let mockToastService: ToastServiceMock;

  beforeEach(async () => {
    mockDialogRef = createDynamicDialogRefMock();

    mockDialogService = createDialogServiceMock();

    mockToastService = createToastServiceMock();

    mockResearchGroupService = {
      createEmployeeResearchGroupRequest: vi.fn(() => of({ researchGroupId: 'test-id' } as any)),
    };

    mockProfOnboardingService = {
      confirmOnboarding: vi.fn(() => of(undefined)) as any,
    };

    await TestBed.configureTestingModule({
      imports: [EmployeeRequestAccessFormComponent, ReactiveFormsModule],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideToastServiceMock(mockToastService),
        provideDialogServiceMock(mockDialogService),
        provideDynamicDialogRefMock(mockDialogRef),
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeRequestAccessFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with professorName field', () => {
      expect(component.employeeForm.get('professorName')).toBeDefined();
    });

    it('should initialize form with empty value', () => {
      expect(component.employeeForm.get('professorName')?.value).toBe('');
    });

    it('should mark professorName as required', () => {
      const control = component.employeeForm.get('professorName');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should enforce minimum length of 3 characters', () => {
      const control = component.employeeForm.get('professorName');
      control?.setValue('ab');
      expect(control?.hasError('minlength')).toBe(true);

      control?.setValue('abc');
      expect(control?.hasError('minlength')).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when professorName is empty', () => {
      component.employeeForm.patchValue({ professorName: '' });
      expect(component.employeeForm.valid).toBe(false);
    });

    it('should be invalid when professorName is less than 3 characters', () => {
      component.employeeForm.patchValue({ professorName: 'AB' });
      expect(component.employeeForm.valid).toBe(false);
    });

    it('should be valid when professorName has at least 3 characters', () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });
      expect(component.employeeForm.valid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should not trigger confirm dialog when form is invalid', () => {
      component.employeeForm.patchValue({ professorName: '' });
      const confirmDialogSpy = vi.fn();
      component.confirmDialog = vi.fn(() => ({ confirm: confirmDialogSpy }) as any) as any;

      component.onSubmit();

      expect(confirmDialogSpy).not.toHaveBeenCalled();
    });

    it('should trigger confirm dialog when form is valid', () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });
      const confirmDialogSpy = vi.fn();
      component.confirmDialog = vi.fn(() => ({ confirm: confirmDialogSpy }) as any) as any;

      component.onSubmit();

      expect(confirmDialogSpy).toHaveBeenCalledOnce();
    });
  });

  describe('onConfirmSubmit', () => {
    it('should not submit when form is invalid', () => {
      component.employeeForm.patchValue({ professorName: '' });

      component.onConfirmSubmit();

      expect(mockResearchGroupService.createEmployeeResearchGroupRequest).not.toHaveBeenCalled();
    });

    it('should not submit when already submitting', () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });
      component.isSubmitting.set(true);

      component.onConfirmSubmit();

      expect(mockResearchGroupService.createEmployeeResearchGroupRequest).not.toHaveBeenCalled();
    });

    it('should call research group service with trimmed professor name', async () => {
      component.employeeForm.patchValue({ professorName: '  Prof. Smith  ' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockResearchGroupService.createEmployeeResearchGroupRequest).toHaveBeenCalledWith({
        professorName: 'Prof. Smith',
      });
    });

    it('should set isSubmitting to true during submission', () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      expect(component.isSubmitting()).toBe(true);
    });

    it('should call confirmOnboarding after successful request', async () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockProfOnboardingService.confirmOnboarding).toHaveBeenCalledOnce();
    });

    it('should show success toast after successful submission', async () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('onboarding.employeeRequest.success');
    });

    it('should close dialog after successful submission', async () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });

    it('should set isSubmitting to false after successful submission', async () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when request fails', async () => {
      mockResearchGroupService.createEmployeeResearchGroupRequest = vi.fn(() => throwError(() => new Error('Request failed')));
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('onboarding.employeeRequest.error');
    });

    it('should not close dialog when submission fails', async () => {
      mockResearchGroupService.createEmployeeResearchGroupRequest = vi.fn(() => throwError(() => new Error('Request failed')));
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should set isSubmitting to false after failed submission', async () => {
      mockResearchGroupService.createEmployeeResearchGroupRequest = vi.fn(() => throwError(() => new Error('Request failed')));
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isSubmitting()).toBe(false);
    });

    it('should not call confirmOnboarding when request fails', async () => {
      mockResearchGroupService.createEmployeeResearchGroupRequest = vi.fn(() => throwError(() => new Error('Request failed')));
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockProfOnboardingService.confirmOnboarding).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog when cancel is clicked', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });
  });

  describe('onBack', () => {
    it('should close current dialog', () => {
      component.onBack();

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
    });

    it('should reopen main onboarding dialog with correct configuration', () => {
      component.onBack();

      expect(mockDialogService.open).toHaveBeenCalledWith(
        OnboardingDialog,
        expect.objectContaining({
          width: '56.25rem',
          header: 'onboarding.title',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing dialog ref gracefully on cancel', () => {
      const fixtureNoRef = TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [EmployeeRequestAccessFormComponent, ReactiveFormsModule],
          providers: [
            provideTranslateMock(),
            provideFontAwesomeTesting(),
            { provide: DynamicDialogRef, useValue: null },
            { provide: DialogService, useValue: mockDialogService },
            { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
            { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
            { provide: ToastService, useValue: mockToastService },
          ],
        })
        .createComponent(EmployeeRequestAccessFormComponent);

      const componentNoRef = fixtureNoRef.componentInstance;

      expect(() => componentNoRef.onCancel()).not.toThrow();
    });

    it('should handle whitespace-only professor name by trimming', async () => {
      component.employeeForm.patchValue({ professorName: '   Prof.   ' });

      component.onConfirmSubmit();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockResearchGroupService.createEmployeeResearchGroupRequest).toHaveBeenCalledWith({
        professorName: 'Prof.',
      });
    });
  });

  describe('Loading State', () => {
    it('should initialize with isSubmitting as false', () => {
      expect(component.isSubmitting()).toBe(false);
    });

    it('should prevent multiple simultaneous submissions', () => {
      component.employeeForm.patchValue({ professorName: 'Prof. Smith' });
      component.isSubmitting.set(true);

      component.onConfirmSubmit();

      expect(mockResearchGroupService.createEmployeeResearchGroupRequest).not.toHaveBeenCalled();
    });
  });
});

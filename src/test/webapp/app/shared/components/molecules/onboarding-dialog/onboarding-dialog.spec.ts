import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OnboardingDialog } from 'app/shared/components/molecules/onboarding-dialog/onboarding-dialog';
import { ProfOnboardingResourceApiService } from 'app/generated/api/profOnboardingResourceApi.service';
import { ProfessorRequestAccessFormComponent } from 'app/shared/components/molecules/onboarding-dialog/professor-request-access-form/professor-request-access-form.component';
import { ONBOARDING_FORM_DIALOG_CONFIG } from 'app/shared/constants/onboarding-dialog.constants';
import { provideTranslateMock } from 'util/translate.mock';
import { EmployeeRequestAccessFormComponent } from 'app/shared/components/molecules/onboarding-dialog/employee-request-access-form/employee-request-access-form.component';

describe('OnboardingDialog', () => {
  let component: OnboardingDialog;
  let fixture: ComponentFixture<OnboardingDialog>;

  let mockDialogService: Partial<DialogService>;
  let mockDialogRef: Partial<DynamicDialogRef>;
  let mockProfOnboardingService: Partial<ProfOnboardingResourceApiService>;

  beforeEach(async () => {
    mockDialogService = {
      open: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockProfOnboardingService = {
      confirmOnboarding: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [OnboardingDialog],
      providers: [
        provideTranslateMock(),
        { provide: DialogService, useValue: mockDialogService },
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        { provide: ProfOnboardingResourceApiService, useValue: mockProfOnboardingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('markOnboarded', () => {
    it('should close the dialog and open the professor form when openForm is true', () => {
      component.markOnboarded(true);

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
      expect(mockDialogService.open).toHaveBeenCalledWith(
        ProfessorRequestAccessFormComponent,
        expect.objectContaining({
          ...ONBOARDING_FORM_DIALOG_CONFIG,
          header: 'onboarding.professorRequest.dialogTitle',
        }),
      );
    });

    it('should close dialog and confirm onboarding when openForm is false', () => {
      component.markOnboarded(false);

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
      expect(mockProfOnboardingService.confirmOnboarding).toHaveBeenCalledOnce();
      expect(mockDialogService.open).not.toHaveBeenCalled();
    });

    it('should default to opening form when no parameter is provided', () => {
      component.markOnboarded();
      expect(mockDialogService.open).toHaveBeenCalled();
    });

    it('should not call confirmOnboarding when openForm is true', () => {
      component.markOnboarded(true);

      expect(mockProfOnboardingService.confirmOnboarding).not.toHaveBeenCalled();
    });

    it('should not open dialog when markOnboarded is called with false', () => {
      component.markOnboarded(false);

      expect(mockDialogService.open).not.toHaveBeenCalled();
    });
  });

  describe('openEmployeeForm', () => {
    it('should close dialog and open employee form', () => {
      component.openEmployeeForm();

      expect(mockDialogRef.close).toHaveBeenCalledOnce();
      expect(mockDialogService.open).toHaveBeenCalledWith(
        EmployeeRequestAccessFormComponent,
        expect.objectContaining({
          ...ONBOARDING_FORM_DIALOG_CONFIG,
          header: 'onboarding.employeeRequest.dialogTitle',
        }),
      );
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import {
  DynamicDialogRefMock,
  createDynamicDialogRefMock,
  provideDynamicDialogRefMock,
  createDynamicDialogConfigMock,
  provideDynamicDialogConfigMock,
} from 'util/dynamicdialogref.mock';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { GradingScaleEditDialogComponent } from 'app/application/application-creation/application-creation-page2/grading-scale-edit-dialog/grading-scale-edit-dialog';

async function configureTestBed(dialogConfig: DynamicDialogConfig, dialogRef: DynamicDialogRefMock): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [GradingScaleEditDialogComponent],
    providers: [
      provideDynamicDialogConfigMock(dialogConfig),
      provideDynamicDialogRefMock(dialogRef),
      provideTranslateMock(createTranslateServiceMock()),
      provideFontAwesomeTesting(),
    ],
  }).compileComponents();
}

describe('GradingScaleEditDialogComponent', () => {
  let fixture: ComponentFixture<GradingScaleEditDialogComponent>;
  let comp: GradingScaleEditDialogComponent;
  let dialogRef: DynamicDialogRefMock;
  let currentGrade = '1.0';
  let originalUpperLimit = '1.0';
  let originalLowerLimit = '4.0';
  let currentGradePercentage = '90%';
  let originalUpperLimitPercentage = '90%';
  let originalLowerLimitPercentage = '50%';

  beforeEach(async () => {
    dialogRef = createDynamicDialogRefMock();
    await configureTestBed(
      createDynamicDialogConfigMock({
        currentGrade: currentGrade,
        currentUpperLimit: originalUpperLimit,
        currentLowerLimit: originalLowerLimit,
      }),
      dialogRef,
    );
    fixture = TestBed.createComponent(GradingScaleEditDialogComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should set currentGrade from dialog config data', () => {
      expect(comp.currentGrade).toBe(currentGrade);
    });

    it('should set originalUpperLimit from dialog config data', () => {
      expect(comp.originalUpperLimit).toBe(originalUpperLimit);
    });

    it('should set originalLowerLimit from dialog config data', () => {
      expect(comp.originalLowerLimit).toBe(originalLowerLimit);
    });

    it('should initialize data signal upperLimit and lowerLimit from config with percentage = false', () => {
      expect(comp.data().upperLimit).toBe(originalUpperLimit);
      expect(comp.data().lowerLimit).toBe(originalLowerLimit);
      expect(comp.data().isPercentage).toBe(false);
    });

    it('should set isPercentage to true when limits contain %', async () => {
      TestBed.resetTestingModule();
      await configureTestBed(
        createDynamicDialogConfigMock({
          currentGrade: currentGradePercentage,
          currentUpperLimit: originalUpperLimitPercentage,
          currentLowerLimit: originalLowerLimitPercentage,
        }),
        createDynamicDialogRefMock(),
      );
      const freshComp = TestBed.createComponent(GradingScaleEditDialogComponent).componentInstance;

      expect(freshComp.data().isPercentage).toBe(true);
    });

    it('should default currentGrade, originalUpperLimit and originalLowerLimit to empty strings when not provided', async () => {
      TestBed.resetTestingModule();
      await configureTestBed(createDynamicDialogConfigMock({}), createDynamicDialogRefMock());
      const freshComp = TestBed.createComponent(GradingScaleEditDialogComponent).componentInstance;

      expect(freshComp.currentGrade).toBe('');
      expect(freshComp.originalUpperLimit).toBe('');
      expect(freshComp.originalLowerLimit).toBe('');
    });
  });

  describe('computed properties', () => {
    describe('isPercentageGrade', () => {
      it('should return false for a standard numeric grade', () => {
        expect(comp.isPercentageGrade()).toBe(false);
      });

      it('should return true when currentGrade is a percentage-type grade', async () => {
        TestBed.resetTestingModule();
        await configureTestBed(
          createDynamicDialogConfigMock({
            currentGrade: currentGradePercentage,
            currentUpperLimit: originalUpperLimitPercentage,
            currentLowerLimit: originalLowerLimitPercentage,
          }),
          createDynamicDialogRefMock(),
        );
        const freshComp = TestBed.createComponent(GradingScaleEditDialogComponent).componentInstance;

        expect(freshComp.isPercentageGrade()).toBe(true);
      });
    });

    describe('limitsForm', () => {
      it('should initialize form controls with the current data signal values', () => {
        comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: originalLowerLimit, isPercentage: false });

        const form = comp.limitsForm();

        expect(form.controls.upperLimit.value).toBe(originalUpperLimit);
        expect(form.controls.lowerLimit.value).toBe(originalLowerLimit);
      });

      it('should return a new form instance when data signal changes', () => {
        const formBefore = comp.limitsForm();
        comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: originalLowerLimit, isPercentage: false });
        const formAfter = comp.limitsForm();

        expect(formBefore).not.toBe(formAfter);
      });
    });

    describe('isValid', () => {
      it('should return false when upperLimit is empty', () => {
        comp.data.set({ upperLimit: '', lowerLimit: originalLowerLimit, isPercentage: false });

        expect(comp.isValid()).toBe(false);
      });

      it('should return false when lowerLimit is empty', () => {
        comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: '', isPercentage: false });

        expect(comp.isValid()).toBe(false);
      });

      it('should return false when both limits are empty', () => {
        comp.data.set({ upperLimit: '', lowerLimit: '', isPercentage: false });

        expect(comp.isValid()).toBe(false);
      });

      it('should return false when upperLimit is whitespace only', () => {
        comp.data.set({ upperLimit: '   ', lowerLimit: originalLowerLimit, isPercentage: false });

        expect(comp.isValid()).toBe(false);
      });

      it('should return false when lowerLimit is whitespace only', () => {
        comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: '   ', isPercentage: false });

        expect(comp.isValid()).toBe(false);
      });
    });
  });

  describe('syncFormToData effect', () => {
    it('should update data.upperLimit when the upperLimit form control changes', async () => {
      const form = comp.limitsForm();
      form.controls.upperLimit.setValue(originalUpperLimit);

      await fixture.whenStable();

      expect(comp.data().upperLimit).toBe(originalUpperLimit);
    });

    it('should update data.lowerLimit when the lowerLimit form control changes', async () => {
      const form = comp.limitsForm();
      form.controls.lowerLimit.setValue(originalLowerLimit);

      await fixture.whenStable();

      expect(comp.data().lowerLimit).toBe(originalLowerLimit);
    });

    it('data.lowerLimit and data.upperLimit should become empty strings when both are null', async () => {
      const form = comp.limitsForm();
      form.controls.lowerLimit.setValue(null);
      form.controls.upperLimit.setValue(null);

      await fixture.whenStable();

      expect(comp.data().lowerLimit).toBe('');
      expect(comp.data().upperLimit).toBe('');
    });

    it('should preserve data.isPercentage when form values change', async () => {
      comp.data.set({ upperLimit: originalUpperLimitPercentage, lowerLimit: originalLowerLimitPercentage, isPercentage: true });
      const form = comp.limitsForm();
      form.controls.upperLimit.setValue('80%');

      await fixture.whenStable();

      expect(comp.data().isPercentage).toBe(true);
    });
  });

  describe('onSwap', () => {
    it('should swap upper and lower limit values', () => {
      comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: originalLowerLimit, isPercentage: false });

      comp.onSwap();

      expect(comp.data().upperLimit).toBe(originalLowerLimit);
      expect(comp.data().lowerLimit).toBe(originalUpperLimit);
    });

    it('should handle swapping when only one value is set', () => {
      comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: '', isPercentage: false });

      comp.onSwap();

      expect(comp.data().upperLimit).toBe('');
      expect(comp.data().lowerLimit).toBe(originalUpperLimit);

      comp.onSwap();

      expect(comp.data().upperLimit).toBe(originalUpperLimit);
      expect(comp.data().lowerLimit).toBe('');
    });

    it('should correctly swap percentage values', () => {
      comp.data.set({ upperLimit: originalUpperLimitPercentage, lowerLimit: originalLowerLimitPercentage, isPercentage: true });

      comp.onSwap();

      expect(comp.data().upperLimit).toBe(originalLowerLimitPercentage);
      expect(comp.data().lowerLimit).toBe(originalUpperLimitPercentage);
    });
  });

  describe('onSave', () => {
    it('should not close dialog when upperLimit is empty', () => {
      comp.data.set({ upperLimit: '', lowerLimit: originalLowerLimit, isPercentage: false });

      comp.onSave();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when lowerLimit is empty', () => {
      comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: '', isPercentage: false });

      comp.onSave();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when both limits are empty', () => {
      comp.data.set({ upperLimit: '', lowerLimit: '', isPercentage: false });

      comp.onSave();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should close dialog exactly once with upperLimit and lowerLimit when valid and grade is non-percentage', () => {
      comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: originalLowerLimit, isPercentage: false });

      comp.onSave();

      expect(dialogRef.close).toHaveBeenCalledOnce();
      expect(dialogRef.close).toHaveBeenCalledWith({ upperLimit: originalUpperLimit, lowerLimit: originalLowerLimit });
    });

    it('should add % to both limits when grade is percentage type and values have no % sign', () => {
      comp.data.set({ upperLimit: '90', lowerLimit: '50', isPercentage: true });
      (comp as any).isValid = () => true;
      (comp as any).isPercentageGrade = () => true;

      comp.onSave();

      expect(dialogRef.close).toHaveBeenCalledOnce();
      expect(dialogRef.close).toHaveBeenCalledWith({ upperLimit: '90%', lowerLimit: '50%' });
    });

    it('should normalize percentage values (strip and re-add %) when limits already contain %', () => {
      comp.data.set({ upperLimit: '90%', lowerLimit: '50%', isPercentage: true });
      (comp as any).isValid = () => true;
      (comp as any).isPercentageGrade = () => true;

      comp.onSave();

      expect(dialogRef.close).toHaveBeenCalledOnce();
      expect(dialogRef.close).toHaveBeenCalledWith({ upperLimit: '90%', lowerLimit: '50%' });
    });

    it('should not modify limit values when grade is non-percentage type, even if values contain %', () => {
      comp.data.set({ upperLimit: originalUpperLimitPercentage, lowerLimit: originalLowerLimitPercentage, isPercentage: false });
      (comp as any).isValid = () => true;
      (comp as any).isPercentageGrade = () => false;

      comp.onSave();

      expect(dialogRef.close).toHaveBeenCalledOnce();
      expect(dialogRef.close).toHaveBeenCalledWith({ upperLimit: originalUpperLimitPercentage, lowerLimit: originalLowerLimitPercentage });
    });
  });

  describe('onCancel', () => {
    it('should close the dialog even when form has valid data filled in', () => {
      comp.data.set({ upperLimit: originalUpperLimit, lowerLimit: originalLowerLimit, isPercentage: false });

      comp.onCancel();

      expect(dialogRef.close).toHaveBeenCalledOnce();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });
  });
});

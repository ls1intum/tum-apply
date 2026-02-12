import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentEditDialogComponent } from 'app/usermanagement/research-group/research-group-departments/department-edit-dialog/department-edit-dialog.component';
import { provideTranslateMock } from 'util/translate.mock';
import { createToastServiceMock, provideToastServiceMock } from 'util/toast-service.mock';
import {
  createDynamicDialogConfigMock,
  createDynamicDialogRefMock,
  provideDynamicDialogConfigMock,
  provideDynamicDialogRefMock,
} from 'util/dynamicdialogref.mock';
import { createDepartmentResourceApiServiceMock, provideDepartmentResourceApiServiceMock } from 'util/department-resource-api.service.mock';
import { createSchoolResourceApiServiceMock, provideSchoolResourceApiServiceMock } from 'util/school-resource-api.service.mock';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SchoolShortDTO } from 'app/generated/model/models';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

describe('DepartmentEditDialogComponent', () => {
  let component: DepartmentEditDialogComponent;
  let fixture: ComponentFixture<DepartmentEditDialogComponent>;
  let mockDepartmentService: ReturnType<typeof createDepartmentResourceApiServiceMock>;
  let mockSchoolService: ReturnType<typeof createSchoolResourceApiServiceMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockDialogRef: ReturnType<typeof createDynamicDialogRefMock>;
  let mockDialogConfig: ReturnType<typeof createDynamicDialogConfigMock>;

  const mockSchools: SchoolShortDTO[] = [
    { schoolId: 's1', name: 'School 1' },
    { schoolId: 's2', name: 'School 2' },
  ];

  beforeEach(async () => {
    mockDepartmentService = createDepartmentResourceApiServiceMock();
    mockSchoolService = createSchoolResourceApiServiceMock();
    mockSchoolService.getAllSchools.mockReturnValue(of(mockSchools));
    mockToastService = createToastServiceMock();
    mockDialogRef = createDynamicDialogRefMock();
    mockDialogConfig = createDynamicDialogConfigMock();

    await TestBed.configureTestingModule({
      imports: [DepartmentEditDialogComponent],
      providers: [
        provideDepartmentResourceApiServiceMock(mockDepartmentService),
        provideSchoolResourceApiServiceMock(mockSchoolService),
        provideDynamicDialogRefMock(mockDialogRef),
        provideDynamicDialogConfigMock(mockDialogConfig),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIconPacks(fas);
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(DepartmentEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Initialization', () => {
    it('should create', () => {
      createComponent();
      expect(component).toBeTruthy();
    });

    it('should load schools on init', async () => {
      createComponent();
      await fixture.whenStable();
      expect(mockSchoolService.getAllSchools).toHaveBeenCalled();
      expect(component.schools()).toEqual(mockSchools);
    });

    it('should map schools to options correctly handling missing values', async () => {
      const schoolsWithMissingValues: SchoolShortDTO[] = [{ schoolId: undefined, name: undefined }];
      mockSchoolService.getAllSchools.mockReturnValue(of(schoolsWithMissingValues));

      createComponent();
      await fixture.whenStable();

      const options = component.schoolOptions();
      expect(options.length).toBe(1);
      expect(options[0].name).toBe('');
      expect(options[0].value).toBe('');
    });

    it('should handle load schools error', async () => {
      mockSchoolService.getAllSchools.mockReturnValue(throwError(() => new Error('Error')));
      createComponent();
      await fixture.whenStable();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.createDialog.errors.loadSchoolsFailed');
    });

    it('should initialize in create mode', () => {
      createComponent();
      expect(component.isEditMode()).toBe(false);
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('schoolId')?.value).toBe('');
    });

    it('should initialize in edit mode', () => {
      mockDialogConfig.data = {
        department: {
          departmentId: 'd1',
          name: 'Dept 1',
          school: { schoolId: 's1', name: 'School 1' },
        },
      };
      createComponent();
      expect(component.isEditMode()).toBe(true);
      expect(component.departmentId()).toBe('d1');
      expect(component.form.get('name')?.value).toBe('Dept 1');
      expect(component.form.get('schoolId')?.value).toBe('s1');
      expect(component.selectedSchoolId()).toBe('s1');
    });
  });

  describe('Form Interaction', () => {
    it('should update form on school change', () => {
      createComponent();
      const option = { name: 'School 2', value: 's2' };
      component.onSchoolChange(option);
      expect(component.selectedSchoolId()).toBe('s2');
      expect(component.form.get('schoolId')?.value).toBe('s2');
    });
  });

  describe('Submission', () => {
    it('should not submit if form is invalid', async () => {
      createComponent();
      await component.onSubmit();
      expect(mockDepartmentService.createDepartment).not.toHaveBeenCalled();
    });

    it('should create department successfully', async () => {
      createComponent();
      component.form.patchValue({ name: 'New Dept', schoolId: 's1' });
      mockDepartmentService.createDepartment.mockReturnValue(of({}));

      await component.onSubmit();

      expect(mockDepartmentService.createDepartment).toHaveBeenCalledWith({ name: 'New Dept', schoolId: 's1' });
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.departments.createDialog.success.created');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should update department successfully', async () => {
      mockDialogConfig.data = {
        department: { departmentId: 'd1', name: 'Old', school: { schoolId: 's1' } },
      };
      createComponent();
      component.form.patchValue({ name: 'Updated Dept' });
      mockDepartmentService.updateDepartment.mockReturnValue(of({}));

      await component.onSubmit();

      expect(mockDepartmentService.updateDepartment).toHaveBeenCalledWith('d1', { name: 'Updated Dept', schoolId: 's1' });
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.departments.createDialog.success.updated');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should handle duplicate name error', async () => {
      createComponent();
      component.form.patchValue({ name: 'New Dept', schoolId: 's1' });
      const error = new HttpErrorResponse({ status: 409 });
      mockDepartmentService.createDepartment.mockReturnValue(throwError(() => error));

      await component.onSubmit();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.createDialog.errors.duplicateName');
    });

    it('should handle other errors during creation', async () => {
      createComponent();
      component.form.patchValue({ name: 'New Dept', schoolId: 's1' });
      const error = new HttpErrorResponse({ status: 500 });
      mockDepartmentService.createDepartment.mockReturnValue(throwError(() => error));

      await component.onSubmit();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.createDialog.errors.createFailed');
    });

    it('should ignore non-HTTP errors during creation', async () => {
      createComponent();
      component.form.patchValue({ name: 'New Dept', schoolId: 's1' });
      mockDepartmentService.createDepartment.mockReturnValue(throwError(() => new Error('Unexpected')));

      await component.onSubmit();

      expect(mockToastService.showErrorKey).not.toHaveBeenCalled();
      expect(mockToastService.showSuccessKey).not.toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog on cancel', () => {
      createComponent();
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});

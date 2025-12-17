import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { ResearchGroupDepartmentsComponent } from 'app/usermanagement/research-group/research-group-departments/research-group-departments.component';
import { DepartmentDTO } from 'app/generated/model/models';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createDialogServiceMock, provideDialogServiceMock } from 'util/dialog.service.mock';
import { createDepartmentResourceApiServiceMock, provideDepartmentResourceApiServiceMock } from 'util/department-resource-api.service.mock';
import { createSchoolResourceApiServiceMock, provideSchoolResourceApiServiceMock } from 'util/school-resource-api.service.mock';
import { DepartmentEditDialogComponent } from 'app/usermanagement/research-group/research-group-departments/department-edit-dialog/department-edit-dialog.component';

describe('ResearchGroupDepartmentsComponent', () => {
  let component: ResearchGroupDepartmentsComponent;
  let fixture: ComponentFixture<ResearchGroupDepartmentsComponent>;
  let mockDepartmentService: ReturnType<typeof createDepartmentResourceApiServiceMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockDialogService: ReturnType<typeof createDialogServiceMock>;

  const mockDepartments: DepartmentDTO[] = [
    {
      departmentId: '1',
      name: 'Dept 1',
      school: { name: 'School 1', abbreviation: 'S1' },
    },
    {
      departmentId: '2',
      name: 'Dept 2',
      school: { name: 'School 2', abbreviation: 'S2' },
    },
  ];

  beforeEach(async () => {
    mockDepartmentService = createDepartmentResourceApiServiceMock();
    mockDepartmentService.getDepartmentsForAdmin.mockReturnValue(of({ content: mockDepartments, totalElements: mockDepartments.length }));
    mockDepartmentService.deleteDepartment.mockReturnValue(of({}));

    const mockSchoolService = createSchoolResourceApiServiceMock();
    mockSchoolService.getAllSchools.mockReturnValue(of([{ schoolId: 's1', name: 'School 1', abbreviation: 'S1' }]));

    mockToastService = createToastServiceMock();
    mockDialogService = createDialogServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupDepartmentsComponent],
      providers: [
        provideDepartmentResourceApiServiceMock(mockDepartmentService),
        provideSchoolResourceApiServiceMock(mockSchoolService),
        provideDialogServiceMock(mockDialogService),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupDepartmentsComponent);
    component = fixture.componentInstance;
  });

  describe('initial load', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('loads departments and maps them correctly', async () => {
      // Trigger load
      await component.loadDepartments();
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(2);
      expect(tableData[0].name).toBe('Dept 1');
      expect(tableData[0].schoolName).toBe('School 1');
      expect(tableData[0].schoolAbbreviation).toBe('S1');
    });

    it('should handle load departments error', async () => {
      mockDepartmentService.getDepartmentsForAdmin.mockReturnValue(throwError(() => new Error('Error')));
      await component.loadDepartments();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.toastMessages.loadFailed');
    });
  });

  describe('pagination', () => {
    it('should update pagination on table emit', () => {
      component.loadOnTableEmit({ first: 10, rows: 5 });
      expect(component.pageNumber()).toBe(2);
      expect(component.pageSize()).toBe(5);
    });

    it('should use default pagination values on table emit if missing', () => {
      component.loadOnTableEmit({});
      expect(component.pageNumber()).toBe(0);
      expect(component.pageSize()).toBe(10);
    });
  });

  describe('search & filter & sort', () => {
    it('calls API with search query', async () => {
      mockDepartmentService.getDepartmentsForAdmin.mockClear();
      await component.onSearchEmit('Dept');
      await Promise.resolve();

      expect(mockDepartmentService.getDepartmentsForAdmin).toHaveBeenCalledWith(10, 0, [], 'Dept', 'name', 'ASC');
    });

    it('calls API with filter values', async () => {
      mockDepartmentService.getDepartmentsForAdmin.mockClear();
      await component.onFilterEmit({ filterId: 'school', selectedValues: ['School 1'] });
      await Promise.resolve();

      expect(mockDepartmentService.getDepartmentsForAdmin).toHaveBeenCalledWith(10, 0, ['School 1'], '', 'name', 'ASC');
    });

    it('calls API on sort change', async () => {
      mockDepartmentService.getDepartmentsForAdmin.mockClear();
      await component.loadOnSortEmit({ field: 'school.name', direction: 'DESC' });
      await Promise.resolve();

      expect(mockDepartmentService.getDepartmentsForAdmin).toHaveBeenCalledWith(10, 0, [], '', 'school.name', 'DESC');
    });
  });

  describe('dialog interactions', () => {
    it('should open create dialog and reload on success', () => {
      const mockDialogRef = { onClose: of(true) };
      mockDialogService.open.mockReturnValue(mockDialogRef);

      // clear previous calls triggered by constructor
      mockDepartmentService.getDepartmentsForAdmin.mockClear();

      component.onCreateDepartment();

      expect(mockDialogService.open).toHaveBeenCalledWith(
        DepartmentEditDialogComponent,
        expect.objectContaining({
          header: expect.any(String),
        }),
      );
      // Should reload departments once after dialog closed with true
      expect(mockDepartmentService.getDepartmentsForAdmin).toHaveBeenCalledTimes(1);
    });

    it('should not reload if create dialog cancelled', () => {
      const mockDialogRef = { onClose: of(false) };
      mockDialogService.open.mockReturnValue(mockDialogRef);

      // clear previous calls triggered by constructor
      mockDepartmentService.getDepartmentsForAdmin.mockClear();

      component.onCreateDepartment();

      expect(mockDepartmentService.getDepartmentsForAdmin).toHaveBeenCalledTimes(0);
    });

    it('should open edit dialog and reload on success', async () => {
      await component.loadDepartments(); // Ensure departments are loaded
      const mockDialogRef = { onClose: of(true) };
      mockDialogService.open.mockReturnValue(mockDialogRef);

      // clear previous calls triggered by constructor and initial load
      mockDepartmentService.getDepartmentsForAdmin.mockClear();

      component.onEditDepartment('1');

      expect(mockDialogService.open).toHaveBeenCalledWith(
        DepartmentEditDialogComponent,
        expect.objectContaining({
          data: { department: mockDepartments[0] },
        }),
      );
      expect(mockDepartmentService.getDepartmentsForAdmin).toHaveBeenCalledTimes(1);
    });

    it('should not open edit dialog if id is missing', () => {
      component.onEditDepartment(undefined);
      expect(mockDialogService.open).not.toHaveBeenCalled();
    });

    it('should not open edit dialog if department not found', () => {
      component.onEditDepartment('999');
      expect(mockDialogService.open).not.toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('should delete department and reload', () => {
      mockDepartmentService.deleteDepartment.mockReturnValue(of({}));

      // clear previous load calls
      mockDepartmentService.getDepartmentsForAdmin.mockClear();

      component.onDeleteDepartment('1');

      expect(mockDepartmentService.deleteDepartment).toHaveBeenCalledWith('1');
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.departments.toastMessages.deleteSuccess');
      expect(mockDepartmentService.getDepartmentsForAdmin).toHaveBeenCalledTimes(1);
    });

    it('should handle delete error', () => {
      mockDepartmentService.deleteDepartment.mockReturnValue(throwError(() => new Error('Error')));

      component.onDeleteDepartment('1');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.toastMessages.deleteFailed');
    });

    it('should not delete if id is missing', () => {
      component.onDeleteDepartment(undefined);
      expect(mockDepartmentService.deleteDepartment).not.toHaveBeenCalled();
    });
  });
});

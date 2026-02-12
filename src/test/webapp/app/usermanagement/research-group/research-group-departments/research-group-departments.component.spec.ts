import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResearchGroupDepartmentsComponent } from 'app/usermanagement/research-group/research-group-departments/research-group-departments.component';
import { DepartmentDTO } from 'app/generated/model/models';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createDialogServiceMock, provideDialogServiceMock } from 'util/dialog.service.mock';
import { createDepartmentResourceApiServiceMock, provideDepartmentResourceApiServiceMock } from 'util/department-resource-api.service.mock';
import { createSchoolResourceApiServiceMock, provideSchoolResourceApiServiceMock } from 'util/school-resource-api.service.mock';
import { DepartmentEditDialogComponent } from 'app/usermanagement/research-group/research-group-departments/department-edit-dialog/department-edit-dialog.component';
import { createRouterMock, provideRouterMock } from 'util/router.mock';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';

describe('ResearchGroupDepartmentsComponent', () => {
  let component: ResearchGroupDepartmentsComponent;
  let fixture: ComponentFixture<ResearchGroupDepartmentsComponent>;
  let mockDepartmentService: ReturnType<typeof createDepartmentResourceApiServiceMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockDialogService: ReturnType<typeof createDialogServiceMock>;
  let mockSchoolService: ReturnType<typeof createSchoolResourceApiServiceMock>;
  let mockRouter: ReturnType<typeof createRouterMock>;

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

    mockSchoolService = createSchoolResourceApiServiceMock();
    mockSchoolService.getAllSchools.mockReturnValue(of([{ schoolId: 's1', name: 'School 1', abbreviation: 'S1' }]));

    mockToastService = createToastServiceMock();
    mockDialogService = createDialogServiceMock();
    mockRouter = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupDepartmentsComponent],
      providers: [
        provideDepartmentResourceApiServiceMock(mockDepartmentService),
        provideSchoolResourceApiServiceMock(mockSchoolService),
        provideDialogServiceMock(mockDialogService),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideRouterMock(mockRouter),
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
      await expect(component.loadDepartments()).resolves.toBeUndefined();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.toastMessages.loadFailed');
    });

    it('should handle load schools error and leave availableSchools empty', async () => {
      mockSchoolService.getAllSchools.mockReturnValue(throwError(() => new Error('Error')));

      // Re-create component so constructor triggers failing loadSchools
      const failingFixture = TestBed.createComponent(ResearchGroupDepartmentsComponent);
      const failingComponent = failingFixture.componentInstance;

      // allow pending microtasks to settle
      await Promise.resolve();

      expect(failingComponent.availableSchools()).toEqual([]);
    });

    it('should treat missing school names as empty strings in availableSchools', () => {
      // set a school without a name
      component.schools.set([{ schoolId: 's2', abbreviation: 'S2' }]);
      expect(component.availableSchools()).toEqual(['']);
    });

    it('should default undefined page response fields to empty and zero', async () => {
      mockDepartmentService.getDepartmentsForAdmin.mockReturnValue(of({}));

      await component.loadDepartments();

      expect(component.departments()).toEqual([]);
      expect(component.total()).toBe(0);
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

    it('does not reload when filter id is not school', async () => {
      mockDepartmentService.getDepartmentsForAdmin.mockClear();

      await component.onFilterEmit({ filterId: 'other', selectedValues: ['X'] });
      await Promise.resolve();

      expect(mockDepartmentService.getDepartmentsForAdmin).not.toHaveBeenCalled();
      expect(component.selectedSchoolFilters()).toEqual([]);
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

    it('should not reload when edit dialog closes without updates', async () => {
      await component.loadDepartments();
      const mockDialogRef = { onClose: of(false) };
      mockDialogService.open.mockReturnValue(mockDialogRef);

      mockDepartmentService.getDepartmentsForAdmin.mockClear();

      component.onEditDepartment('1');

      expect(mockDepartmentService.getDepartmentsForAdmin).not.toHaveBeenCalled();
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
    it('should navigate to department images page', () => {
      component.onViewDepartmentImages();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/research-group/departments/images']);
    });

    it('should return empty menu items when department id is missing', () => {
      const deleteDialog = { confirm: vi.fn() } as unknown as ConfirmDialog;

      expect(component.menuItems({ departmentId: undefined }, deleteDialog)).toEqual([]);
    });

    it('should build menu items and execute commands', () => {
      const deleteDialog = { confirm: vi.fn() } as unknown as ConfirmDialog;

      const items = component.menuItems({ departmentId: '1' }, deleteDialog);
      expect(items.length).toBe(2);

      items[0].command?.();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/research-group/departments/images']);

      items[1].command?.();
      expect(deleteDialog.confirm).toHaveBeenCalled();
    });

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

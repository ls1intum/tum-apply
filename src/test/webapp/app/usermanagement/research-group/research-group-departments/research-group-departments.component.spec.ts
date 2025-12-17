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
    mockDepartmentService.getDepartments.mockReturnValue(of(mockDepartments));
    mockToastService = createToastServiceMock();
    mockDialogService = createDialogServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupDepartmentsComponent],
      providers: [
        provideDepartmentResourceApiServiceMock(mockDepartmentService),
        provideDialogServiceMock(mockDialogService),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupDepartmentsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load departments and map them correctly', async () => {
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
    mockDepartmentService.getDepartments.mockReturnValue(throwError(() => new Error('Error')));
    await component.loadDepartments();
    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.toastMessages.loadFailed');
  });

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

  it('should open create dialog', () => {
    const mockDialogRef = { onClose: of(true) };
    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onCreateDepartment();

    expect(mockDialogService.open).toHaveBeenCalledWith(
      DepartmentEditDialogComponent,
      expect.objectContaining({
        header: expect.any(String),
      }),
    );
    // Should reload departments if created is true
    expect(mockDepartmentService.getDepartments).toHaveBeenCalledTimes(2); // 1 from constructor, 1 from reload
  });

  it('should not reload if create dialog cancelled', () => {
    const mockDialogRef = { onClose: of(false) };
    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onCreateDepartment();

    expect(mockDepartmentService.getDepartments).toHaveBeenCalledTimes(1); // Only from constructor
  });

  it('should open edit dialog', async () => {
    await component.loadDepartments(); // Ensure departments are loaded
    const mockDialogRef = { onClose: of(true) };
    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onEditDepartment('1');

    expect(mockDialogService.open).toHaveBeenCalledWith(
      DepartmentEditDialogComponent,
      expect.objectContaining({
        data: { department: mockDepartments[0] },
      }),
    );
    expect(mockDepartmentService.getDepartments).toHaveBeenCalledTimes(3);
  });

  it('should not open edit dialog if id is missing', () => {
    component.onEditDepartment(undefined);
    expect(mockDialogService.open).not.toHaveBeenCalled();
  });

  it('should not open edit dialog if department not found', () => {
    component.onEditDepartment('999');
    expect(mockDialogService.open).not.toHaveBeenCalled();
  });

  it('should delete department', () => {
    mockDepartmentService.deleteDepartment.mockReturnValue(of({}));

    component.onDeleteDepartment('1');

    expect(mockDepartmentService.deleteDepartment).toHaveBeenCalledWith('1');
    expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.departments.toastMessages.deleteSuccess');
    expect(mockDepartmentService.getDepartments).toHaveBeenCalledTimes(2);
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

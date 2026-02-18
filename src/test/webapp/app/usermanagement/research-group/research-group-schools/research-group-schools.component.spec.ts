import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { ResearchGroupSchoolsComponent } from 'app/usermanagement/research-group/research-group-schools/research-group-schools.component';
import { SchoolShortDTO } from 'app/generated/model/schoolShortDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createDialogServiceMock, provideDialogServiceMock } from 'util/dialog.service.mock';
import { createSchoolResourceApiServiceMock, provideSchoolResourceApiServiceMock } from 'util/school-resource-api.service.mock';
import { SchoolEditDialogComponent } from 'app/usermanagement/research-group/research-group-schools/school-edit-dialog/school-edit-dialog.component';

describe('ResearchGroupSchoolsComponent', () => {
  let component: ResearchGroupSchoolsComponent;
  let fixture: ComponentFixture<ResearchGroupSchoolsComponent>;
  let mockSchoolService: ReturnType<typeof createSchoolResourceApiServiceMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockDialogService: ReturnType<typeof createDialogServiceMock>;

  const mockSchools: SchoolShortDTO[] = [
    { schoolId: 's1', name: 'School 1', abbreviation: 'S1' },
    { schoolId: 's2', name: 'School 2', abbreviation: 'S2' },
  ];

  beforeEach(async () => {
    mockSchoolService = createSchoolResourceApiServiceMock();
    mockSchoolService.getSchoolsForAdmin.mockReturnValue(of({ content: mockSchools, totalElements: mockSchools.length }));
    mockSchoolService.deleteSchool.mockReturnValue(of({}));

    mockToastService = createToastServiceMock();
    mockDialogService = createDialogServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupSchoolsComponent],
      providers: [
        provideSchoolResourceApiServiceMock(mockSchoolService),
        provideDialogServiceMock(mockDialogService),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupSchoolsComponent);
    component = fixture.componentInstance;
  });

  describe('initial load', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('loads schools and maps them correctly', async () => {
      await component.loadSchools();
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(2);
      expect(tableData[0].name).toBe('School 1');
      expect(tableData[0].abbreviation).toBe('S1');
    });

    it('should handle load schools error', async () => {
      mockSchoolService.getSchoolsForAdmin.mockReturnValue(throwError(() => new Error('Error')));
      await expect(component.loadSchools()).resolves.toBeUndefined();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.schools.toastMessages.loadFailed');
    });

    it('should default undefined page response fields to empty and zero', async () => {
      mockSchoolService.getSchoolsForAdmin.mockReturnValue(of({}));

      await component.loadSchools();

      expect(component.schools()).toEqual([]);
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

  describe('search & sort', () => {
    it('calls API with search query', async () => {
      mockSchoolService.getSchoolsForAdmin.mockClear();
      component.onSearchEmit('School');
      await Promise.resolve();

      expect(mockSchoolService.getSchoolsForAdmin).toHaveBeenCalledWith(10, 0, 'School', 'name', 'ASC');
    });

    it('calls API on sort change', async () => {
      mockSchoolService.getSchoolsForAdmin.mockClear();
      component.loadOnSortEmit({ field: 'abbreviation', direction: 'DESC' });
      await Promise.resolve();

      expect(mockSchoolService.getSchoolsForAdmin).toHaveBeenCalledWith(10, 0, '', 'abbreviation', 'DESC');
    });
  });

  describe('dialog interactions', () => {
    it('should open create dialog and reload on success', async () => {
      const mockDialogRef = { onClose: of(true) };
      mockDialogService.open.mockReturnValue(mockDialogRef);

      mockSchoolService.getSchoolsForAdmin.mockClear();
      await component.onCreateSchool();

      expect(mockDialogService.open).toHaveBeenCalledWith(
        SchoolEditDialogComponent,
        expect.objectContaining({
          header: expect.any(String),
        }),
      );
      expect(mockSchoolService.getSchoolsForAdmin).toHaveBeenCalledTimes(1);
    });

    it('should not reload if create dialog cancelled', async () => {
      const mockDialogRef = { onClose: of(false) };
      mockDialogService.open.mockReturnValue(mockDialogRef);

      mockSchoolService.getSchoolsForAdmin.mockClear();
      await component.onCreateSchool();

      expect(mockSchoolService.getSchoolsForAdmin).toHaveBeenCalledTimes(0);
    });

    it('should open edit dialog and reload on success', async () => {
      await component.loadSchools();
      const mockDialogRef = { onClose: of(true) };
      mockDialogService.open.mockReturnValue(mockDialogRef);

      mockSchoolService.getSchoolsForAdmin.mockClear();
      await component.onEditSchool('s1');

      expect(mockDialogService.open).toHaveBeenCalledWith(
        SchoolEditDialogComponent,
        expect.objectContaining({
          data: { school: mockSchools[0] },
        }),
      );
      expect(mockSchoolService.getSchoolsForAdmin).toHaveBeenCalledTimes(1);
    });

    it('should not open edit dialog if id is missing', async () => {
      await component.onEditSchool(undefined);
      expect(mockDialogService.open).not.toHaveBeenCalled();
    });

    it('should not open edit dialog if school not found', async () => {
      await component.onEditSchool('missing');
      expect(mockDialogService.open).not.toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('should delete school and reload', async () => {
      mockSchoolService.deleteSchool.mockReturnValue(of({}));

      mockSchoolService.getSchoolsForAdmin.mockClear();
      await component.onDeleteSchool('s1');

      expect(mockSchoolService.deleteSchool).toHaveBeenCalledWith('s1');
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.schools.toastMessages.deleteSuccess');
      expect(mockSchoolService.getSchoolsForAdmin).toHaveBeenCalledTimes(1);
    });

    it('should handle delete error', async () => {
      mockSchoolService.deleteSchool.mockReturnValue(throwError(() => new Error('Error')));

      await component.onDeleteSchool('s1');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.schools.toastMessages.deleteFailed');
    });

    it('should not delete if id is missing', async () => {
      await component.onDeleteSchool(undefined);
      expect(mockSchoolService.deleteSchool).not.toHaveBeenCalled();
    });
  });
});

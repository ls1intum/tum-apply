import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { AllPositionsPageComponent } from 'app/job/all-positions/all-positions-page.component';
import { AdminCreatedJobDTO, AdminCreatedJobDTOStateEnum } from 'app/generated/model/admin-created-job-dto';
import { PageAdminCreatedJobDTO } from 'app/generated/model/page-admin-created-job-dto';
import { ResearchGroupResourceApi } from 'app/generated/api/research-group-resource-api';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import {
  createJobResourceApiMock,
  JobResourceApiMock,
  provideJobResourceApiMock,
} from 'src/test/webapp/util/job-resource-api.service.mock';
import {
  createResearchGroupResourceApiMock,
  ResearchGroupResourceApiMock,
} from 'src/test/webapp/util/research-group-resource-api.service.mock';
import { createRouterMock, provideRouterMock, RouterMock } from 'src/test/webapp/util/router.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';

describe('AllPositionsPageComponent', () => {
  let fixture: ComponentFixture<AllPositionsPageComponent>;
  let component: AllPositionsPageComponent;

  let router: RouterMock;
  let mockJobApi: JobResourceApiMock;
  let mockRgApi: ResearchGroupResourceApiMock;
  let mockToastService: ReturnType<typeof createToastServiceMock>;

  beforeEach(async () => {
    mockJobApi = createJobResourceApiMock();
    mockJobApi.getAllJobs.mockReturnValue(
      of<PageAdminCreatedJobDTO>({
        content: [
          {
            jobId: '1',
            title: 'Job A',
            state: AdminCreatedJobDTOStateEnum.Draft,
            researchGroupName: 'RG 1',
            professorName: 'Alice Example',
          } as AdminCreatedJobDTO,
        ],
        totalElements: 1,
      }),
    );
    mockJobApi.deleteJob.mockReturnValue(of({}));
    mockJobApi.changeJobState.mockReturnValue(of({}));

    mockRgApi = createResearchGroupResourceApiMock();
    mockRgApi.getResearchGroupsForAdmin.mockReturnValue(
      of({
        content: [{ id: 'r1', researchGroup: 'RG 1' }],
        totalElements: 1,
      }),
    );
    mockRgApi.getAllProfessors.mockReturnValue(of([{ userId: 'p1', firstName: 'Prof', lastName: 'One' }]));

    mockToastService = createToastServiceMock();

    router = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [AllPositionsPageComponent, TranslateModule.forRoot()],
      providers: [
        provideJobResourceApiMock(mockJobApi),
        { provide: ResearchGroupResourceApi, useValue: mockRgApi },
        provideRouterMock(router),
        provideToastServiceMock(mockToastService),
        provideFontAwesomeTesting(),
        provideTranslateMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AllPositionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load research-group options on init via getResearchGroupsForAdmin', async () => {
      expect(mockRgApi.getResearchGroupsForAdmin).toHaveBeenCalled();
      expect(component.researchGroupOptions()).toEqual([{ id: 'r1', name: 'RG 1' }]);
    });

    it('should load professor options on init using firstName + lastName', async () => {
      expect(mockRgApi.getAllProfessors).toHaveBeenCalled();
      expect(component.professorOptions()).toEqual([{ id: 'p1', name: 'Prof One' }]);
    });

    it('should drop research-group entries with missing id or name', async () => {
      mockRgApi.getResearchGroupsForAdmin.mockReturnValueOnce(
        of({
          content: [
            { id: 'r1', researchGroup: 'RG 1' },
            { id: '', researchGroup: 'No Id' },
            { id: 'r2', researchGroup: '' },
          ],
          totalElements: 3,
        }),
      );
      mockRgApi.getAllProfessors.mockReturnValueOnce(of([]));

      const newFixture = TestBed.createComponent(AllPositionsPageComponent);
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(newFixture.componentInstance.researchGroupOptions()).toEqual([{ id: 'r1', name: 'RG 1' }]);
    });

    it('should drop professor entries with missing id or name', async () => {
      mockRgApi.getAllProfessors.mockReturnValueOnce(
        of([
          { userId: 'p1', firstName: 'Prof', lastName: 'One' },
          { userId: '', firstName: 'No', lastName: 'Id' },
          { userId: 'p2', firstName: '', lastName: '' },
        ]),
      );
      mockRgApi.getResearchGroupsForAdmin.mockReturnValueOnce(of({ content: [], totalElements: 0 }));

      const newFixture = TestBed.createComponent(AllPositionsPageComponent);
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(newFixture.componentInstance.professorOptions()).toEqual([{ id: 'p1', name: 'Prof One' }]);
    });

    it('should toast loadFilters error when getResearchGroupsForAdmin fails', async () => {
      mockRgApi.getResearchGroupsForAdmin.mockReturnValueOnce(throwError(() => new Error('fail')));
      mockRgApi.getAllProfessors.mockReturnValueOnce(of([]));

      const newFixture = TestBed.createComponent(AllPositionsPageComponent);
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('allPositionsPage.errors.loadFilters');
    });

    it('should toast loadFilters error when getAllProfessors fails', async () => {
      mockRgApi.getResearchGroupsForAdmin.mockReturnValueOnce(of({ content: [], totalElements: 0 }));
      mockRgApi.getAllProfessors.mockReturnValueOnce(throwError(() => new Error('fail')));

      const newFixture = TestBed.createComponent(AllPositionsPageComponent);
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('allPositionsPage.errors.loadFilters');
    });
  });

  describe('Columns', () => {
    it('should include researchGroupName, supervising professor, title, state and actions columns', () => {
      const fields = component.columns().map(c => c.field);
      expect(fields).toContain('professorName');
      expect(fields).toContain('researchGroupName');
      expect(fields).toContain('title');
      expect(fields).toContain('state');
      expect(fields).toContain('actions');
      expect(fields).toContain('startDate');
      expect(fields).toContain('lastModifiedAt');
    });

    it('should bind templates to the expected columns', () => {
      const cols = component.columns();
      expect(cols.find(c => c.field === 'actions')?.template).toBeTruthy();
      expect(cols.find(c => c.field === 'state')?.template).toBeTruthy();
      expect(cols.find(c => c.field === 'startDate')?.template).toBeTruthy();
      expect(cols.find(c => c.field === 'lastModifiedAt')?.template).toBeTruthy();
      expect(cols.find(c => c.field === 'professorName')?.template).toBeTruthy();
      expect(cols.find(c => c.field === 'researchGroupName')?.template).toBeUndefined();
      expect(cols.find(c => c.field === 'title')?.template).toBeUndefined();
    });

    it('should build stateTextMap from availableStatusOptions', () => {
      const map = component.stateTextMap();
      expect(map.DRAFT).toBe('jobState.draft');
      expect(map.PUBLISHED).toBe('jobState.published');
      expect(map.CLOSED).toBe('jobState.closed');
      expect(map.APPLICANT_FOUND).toBe('jobState.applicantFound');
    });
  });

  describe('Lazy load and pagination', () => {
    it('should call getAllJobs with current paging on lazy load', async () => {
      mockJobApi.getAllJobs.mockClear();
      component.loadOnTableEmit({ first: 20, rows: 10 });
      await fixture.whenStable();
      expect(component.page()).toBe(2);
      expect(component.pageSize()).toBe(10);
      expect(mockJobApi.getAllJobs).toHaveBeenCalled();
    });

    it('should fall back to current pageSize when event values are missing', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.pageSize.set(5);
      component.loadOnTableEmit({});
      expect(component.page()).toBe(0);
      expect(component.pageSize()).toBe(5);
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('Search and filters', () => {
    it('should reload with normalized query on search emit', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.searchQuery.set('old');
      component.onSearchEmit('  new   query ');
      expect(component.searchQuery()).toBe('new query');
      expect(component.page()).toBe(0);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should not reload when search query is unchanged', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.searchQuery.set('same query');
      component.onSearchEmit(' same   query ');
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should map status translation keys to enum values and reload', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.onFilterEmit({ filterId: 'status', selectedValues: ['jobState.draft', 'jobState.published'] });
      expect(component.selectedStatusFilters()).toEqual([AdminCreatedJobDTOStateEnum.Draft, AdminCreatedJobDTOStateEnum.Published]);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should map research-group display names to ids and reload', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.onFilterEmit({ filterId: 'researchGroup', selectedValues: ['RG 1'] });
      expect(component.selectedResearchGroupIds()).toEqual(['r1']);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should map professor display names to ids and reload', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.onFilterEmit({ filterId: 'professor', selectedValues: ['Prof One'] });
      expect(component.selectedProfessorIds()).toEqual(['p1']);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should keep original value when name is not found in research-group options', () => {
      vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.onFilterEmit({ filterId: 'researchGroup', selectedValues: ['Unknown RG'] });
      expect(component.selectedResearchGroupIds()).toEqual(['Unknown RG']);
    });

    it('should ignore unknown filter ids', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.onFilterEmit({ filterId: 'somethingElse', selectedValues: ['x'] });
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should reset page and store sort field/direction on sort emit', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.page.set(3);
      component.loadOnSortEmit({ field: 'title', direction: 'ASC' });
      expect(component.page()).toBe(0);
      expect(component.sortBy()).toBe('title');
      expect(component.sortDirection()).toBe('ASC');
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('Load jobs', () => {
    it('should call getAllJobs with mapped filter ids', async () => {
      component.selectedStatusFilters.set([AdminCreatedJobDTOStateEnum.Published]);
      component.selectedResearchGroupIds.set(['r1']);
      component.selectedProfessorIds.set(['p1']);
      mockJobApi.getAllJobs.mockClear();
      mockJobApi.getAllJobs.mockReturnValue(of<PageAdminCreatedJobDTO>({ content: [], totalElements: 0 }));

      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();

      expect(mockJobApi.getAllJobs).toHaveBeenCalledWith(
        component.pageSize(),
        component.page(),
        [AdminCreatedJobDTOStateEnum.Published],
        ['r1'],
        ['p1'],
        component.sortBy(),
        component.sortDirection(),
        component.searchQuery(),
      );
    });

    it('should pass undefined for empty filter arrays', async () => {
      component.selectedStatusFilters.set([]);
      component.selectedResearchGroupIds.set([]);
      component.selectedProfessorIds.set([]);
      mockJobApi.getAllJobs.mockClear();
      mockJobApi.getAllJobs.mockReturnValue(of<PageAdminCreatedJobDTO>({ content: [], totalElements: 0 }));

      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();

      expect(mockJobApi.getAllJobs).toHaveBeenCalledWith(
        component.pageSize(),
        component.page(),
        undefined,
        undefined,
        undefined,
        component.sortBy(),
        component.sortDirection(),
        component.searchQuery(),
      );
    });

    it('should toast loadJobs error when API fails', async () => {
      mockJobApi.getAllJobs.mockReturnValueOnce(throwError(() => new Error('fail')));
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('allPositionsPage.errors.loadJobs');
    });

    it('should default jobs and totalRecords when API returns undefined values', async () => {
      mockJobApi.getAllJobs.mockReturnValueOnce(of<PageAdminCreatedJobDTO>({ content: undefined, totalElements: undefined }));
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
      expect(component.jobs()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
    });
  });

  describe('Job actions', () => {
    it('should navigate to edit page on Edit', () => {
      component.onEditJob('123');
      expect(router.navigate).toHaveBeenCalledWith(['/job/edit/123']);
    });

    it('should log error when editing with empty id', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      component.onEditJob('');
      expect(spy).toHaveBeenCalled();
    });

    it('should navigate to detail page on View', () => {
      component.onViewJob('321');
      expect(router.navigate).toHaveBeenCalledWith(['/job/detail/321']);
    });

    it('should call deleteJob and refresh on delete', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      await component.onDeleteJob('1');
      expect(mockJobApi.deleteJob).toHaveBeenCalledWith('1');
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('allPositionsPage.toastMessages.deleteJobSuccess');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should toast on delete failure', async () => {
      vi.spyOn(mockJobApi, 'deleteJob').mockReturnValueOnce(throwError(() => new Error('delete failed')));
      await component.onDeleteJob('1');
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(
        'allPositionsPage.toastMessages.deleteJobFailed',
        expect.objectContaining({ detail: expect.stringContaining('delete failed') }),
      );
    });

    it('should call changeJobState(CLOSED) and refresh on close', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      await component.onCloseJob('1');
      expect(mockJobApi.changeJobState).toHaveBeenCalledWith('1', AdminCreatedJobDTOStateEnum.Closed);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('allPositionsPage.toastMessages.closeJobSuccess');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should toast on close failure', async () => {
      vi.spyOn(mockJobApi, 'changeJobState').mockReturnValueOnce(throwError(() => new Error('close fail')));
      await component.onCloseJob('1');
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(
        'allPositionsPage.toastMessages.closeJobFailed',
        expect.objectContaining({ detail: expect.stringContaining('close fail') }),
      );
    });
  });

  describe('Confirm actions', () => {
    it('should skip confirm edit when currentJobId is undefined', () => {
      const spy = vi.spyOn(component, 'onEditJob');
      component.currentJobId.set(undefined);
      component.onConfirmEdit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should confirm edit when currentJobId is set', () => {
      const spy = vi.spyOn(component, 'onEditJob');
      component.currentJobId.set('job-1');
      component.onConfirmEdit();
      expect(spy).toHaveBeenCalledWith('job-1');
    });

    it('should skip confirm delete when currentJobId is empty', async () => {
      const spy = vi.spyOn(component, 'onDeleteJob').mockResolvedValue();
      component.currentJobId.set('');
      await component.onConfirmDelete();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call onDeleteJob on confirmed delete', async () => {
      const spy = vi.spyOn(component, 'onDeleteJob').mockResolvedValue();
      component.currentJobId.set('job-2');
      await component.onConfirmDelete();
      expect(spy).toHaveBeenCalledWith('job-2');
    });

    it('should skip confirm close when currentJobId is empty', async () => {
      const spy = vi.spyOn(component, 'onCloseJob').mockResolvedValue();
      component.currentJobId.set('');
      await component.onConfirmClose();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call onCloseJob on confirmed close', async () => {
      const spy = vi.spyOn(component, 'onCloseJob').mockResolvedValue();
      component.currentJobId.set('job-3');
      await component.onConfirmClose();
      expect(spy).toHaveBeenCalledWith('job-3');
    });
  });

  describe('Job menu items', () => {
    it('should build edit/delete menu items for draft jobs', () => {
      component.jobs.set([{ jobId: '1', state: AdminCreatedJobDTOStateEnum.Draft, title: 'Draft' } as AdminCreatedJobDTO]);
      const items = component.jobMenuItems().get('1') ?? [];
      expect(items.map(i => i.label)).toEqual(['button.edit', 'button.delete']);
    });

    it('should build edit/delete/close menu items for published jobs', () => {
      component.jobs.set([{ jobId: '2', state: AdminCreatedJobDTOStateEnum.Published, title: 'Pub' } as AdminCreatedJobDTO]);
      const items = component.jobMenuItems().get('2') ?? [];
      expect(items.map(i => i.label)).toEqual(['button.edit', 'button.delete', 'button.close']);
    });

    it('should build edit/delete/reopen menu items for closed jobs', () => {
      component.jobs.set([{ jobId: '3', state: AdminCreatedJobDTOStateEnum.Closed, title: 'Closed' } as AdminCreatedJobDTO]);
      expect(component.jobMenuItems().get('3')?.map(i => i.label)).toEqual(['button.edit', 'button.delete', 'button.reopen']);
    });

    it('should build edit/delete/reopen menu items for applicant-found jobs', () => {
      component.jobs.set([{ jobId: '4', state: AdminCreatedJobDTOStateEnum.ApplicantFound, title: 'Found' } as AdminCreatedJobDTO]);
      expect(component.jobMenuItems().get('4')?.map(i => i.label)).toEqual(['button.edit', 'button.delete', 'button.reopen']);
    });

    it('should invoke edit command directly for draft jobs', () => {
      const editSpy = vi.spyOn(component, 'onEditJob');
      component.jobs.set([{ jobId: '1', state: AdminCreatedJobDTOStateEnum.Draft, title: 'Draft' } as AdminCreatedJobDTO]);
      const items = component.jobMenuItems().get('1') ?? [];
      items[0]?.command?.();
      expect(editSpy).toHaveBeenCalledWith('1');
    });

    it('should open the edit-published dialog for published jobs', () => {
      component.jobs.set([{ jobId: '2', state: AdminCreatedJobDTOStateEnum.Published, title: 'Pub' } as AdminCreatedJobDTO]);
      const items = component.jobMenuItems().get('2') ?? [];
      items[0]?.command?.();
      expect(component.currentJobId()).toBe('2');
      expect(component.showEditPublishedDialog()).toBe(true);
    });

    it('should open the delete dialog for draft jobs', () => {
      component.jobs.set([{ jobId: '1', state: AdminCreatedJobDTOStateEnum.Draft, title: 'Draft' } as AdminCreatedJobDTO]);
      const items = component.jobMenuItems().get('1') ?? [];
      items[1]?.command?.();
      expect(component.currentJobId()).toBe('1');
      expect(component.showDeleteDialog()).toBe(true);
    });

    it('should open the close dialog for published jobs', () => {
      component.jobs.set([{ jobId: '2', state: AdminCreatedJobDTOStateEnum.Published, title: 'Pub' } as AdminCreatedJobDTO]);
      const items = component.jobMenuItems().get('2') ?? [];
      items[2]?.command?.();
      expect(component.currentJobId()).toBe('2');
      expect(component.showCloseDialog()).toBe(true);
    });
  });

  describe('Kebab menu by state', () => {
    function setJobsAndRebuild(state: AdminCreatedJobDTOStateEnum) {
      mockJobApi.getAllJobs.mockReturnValueOnce(
        of<PageAdminCreatedJobDTO>({
          content: [{ jobId: 'j', title: 'T', state } as AdminCreatedJobDTO],
          totalElements: 1,
        }),
      );
      component.loadOnTableEmit({ first: 0, rows: 10 } as never);
    }

    it('should show Edit and Delete on DRAFT', async () => {
      setJobsAndRebuild(AdminCreatedJobDTOStateEnum.Draft);
      await fixture.whenStable();
      const items = component.getMenuItems()(component.jobs()[0]);
      expect(items.map(i => i.label)).toEqual(['button.edit', 'button.delete']);
    });

    it('should show Edit, Delete and Close on PUBLISHED', async () => {
      setJobsAndRebuild(AdminCreatedJobDTOStateEnum.Published);
      await fixture.whenStable();
      const items = component.getMenuItems()(component.jobs()[0]);
      expect(items.map(i => i.label)).toEqual(['button.edit', 'button.delete', 'button.close']);
    });

    it('should show Edit, Delete and Reopen on CLOSED', async () => {
      setJobsAndRebuild(AdminCreatedJobDTOStateEnum.Closed);
      await fixture.whenStable();
      const items = component.getMenuItems()(component.jobs()[0]);
      expect(items.map(i => i.label)).toEqual(['button.edit', 'button.delete', 'button.reopen']);
    });

    it('should show Edit, Delete and Reopen on APPLICANT_FOUND', async () => {
      setJobsAndRebuild(AdminCreatedJobDTOStateEnum.ApplicantFound);
      await fixture.whenStable();
      const items = component.getMenuItems()(component.jobs()[0]);
      expect(items.map(i => i.label)).toEqual(['button.edit', 'button.delete', 'button.reopen']);
    });
  });

  describe('Reopen flow', () => {
    it('should call changeJobState with PUBLISHED when reopen is confirmed', async () => {
      component.currentJobId.set('j');
      await component.onConfirmReopen();
      expect(mockJobApi.changeJobState).toHaveBeenCalledExactlyOnceWith('j', AdminCreatedJobDTOStateEnum.Published);
    });

    it('should show success toast and reload jobs after a successful reopen', async () => {
      component.currentJobId.set('j');
      await component.onConfirmReopen();
      expect(mockToastService.showSuccessKey).toHaveBeenCalledExactlyOnceWith('allPositionsPage.toastMessages.reopenJobSuccess');
    });

    it('should show error toast on reopen failure', async () => {
      mockJobApi.changeJobState.mockReturnValueOnce(throwError(() => new Error('boom')));
      component.currentJobId.set('j');
      await component.onConfirmReopen();
      expect(mockToastService.showErrorKey).toHaveBeenCalledExactlyOnceWith(
        'allPositionsPage.toastMessages.reopenJobFailed',
        { detail: 'boom' },
      );
    });
  });

  describe('Delete dialog copy', () => {
    it('should expose draft delete copy when current job is DRAFT', async () => {
      mockJobApi.getAllJobs.mockReturnValueOnce(
        of<PageAdminCreatedJobDTO>({
          content: [{ jobId: 'j', title: 'T', state: AdminCreatedJobDTOStateEnum.Draft } as AdminCreatedJobDTO],
          totalElements: 1,
        }),
      );
      component.loadOnTableEmit({ first: 0, rows: 10 } as never);
      await fixture.whenStable();
      component.currentJobId.set('j');
      expect(component.deleteDialogHeaderKey()).toBe('allPositionsPage.confirmDialog.deleteHeader');
      expect(component.deleteDialogMessageKey()).toBe('allPositionsPage.confirmDialog.deleteMessage');
    });

    it('should expose non-draft delete copy when current job is PUBLISHED', async () => {
      mockJobApi.getAllJobs.mockReturnValueOnce(
        of<PageAdminCreatedJobDTO>({
          content: [{ jobId: 'j', title: 'T', state: AdminCreatedJobDTOStateEnum.Published } as AdminCreatedJobDTO],
          totalElements: 1,
        }),
      );
      component.loadOnTableEmit({ first: 0, rows: 10 } as never);
      await fixture.whenStable();
      component.currentJobId.set('j');
      expect(component.deleteDialogHeaderKey()).toBe('allPositionsPage.confirmDialog.deleteHeaderNonDraft');
      expect(component.deleteDialogMessageKey()).toBe('allPositionsPage.confirmDialog.deleteMessageNonDraft');
    });
  });

  describe('Create job button', () => {
    it('should navigate to /job/create when clicked', () => {
      component.onCreateJob();
      expect(router.navigate).toHaveBeenCalledExactlyOnceWith(['/job/create']);
    });
  });
});

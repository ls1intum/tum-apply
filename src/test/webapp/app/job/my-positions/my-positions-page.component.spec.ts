import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, it, expect, vi, Mocked } from 'vitest';
import { of, throwError, EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MyPositionsPageComponent } from 'app/job/my-positions/my-positions-page.component';
import { AccountService } from 'app/core/auth/account.service';
import { CreatedJobDTO } from 'app/generated/model/createdJobDTO';
import { PageCreatedJobDTO } from 'app/generated/model/pageCreatedJobDTO';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import {
  createJobResourceApiServiceMock,
  JobResourceApiServiceMock,
  provideJobResourceApiServiceMock,
} from 'src/test/webapp/util/job-resource-api.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';

describe('MyPositionsPageComponent', () => {
  let fixture: ComponentFixture<MyPositionsPageComponent>;
  let component: MyPositionsPageComponent;

  let accountService: Mocked<AccountService>;
  let router: Mocked<Router>;

  let mockJobService: JobResourceApiServiceMock;

  let mockToastService: ReturnType<typeof createToastServiceMock>;

  beforeEach(async () => {
    mockJobService = createJobResourceApiServiceMock();
    mockJobService.getJobsForCurrentResearchGroup.mockReturnValue(
      of<PageCreatedJobDTO>({
        content: [{ jobId: '1', title: 'Job A', state: 'DRAFT' } as CreatedJobDTO],
        totalElements: 1,
      }),
    );
    mockJobService.deleteJob.mockReturnValue(of({}));
    mockJobService.changeJobState.mockReturnValue(of({}));

    mockToastService = createToastServiceMock();

    accountService = {
      loadedUser: vi.fn().mockReturnValue({ id: 'u1', name: 'User' }),
    } as unknown as Mocked<AccountService>;

    router = {
      navigate: vi.fn(),
      events: EMPTY,
    } as unknown as Mocked<Router>;

    await TestBed.configureTestingModule({
      imports: [MyPositionsPageComponent, TranslateModule.forRoot()],
      providers: [
        provideJobResourceApiServiceMock(mockJobService),
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        provideToastServiceMock(mockToastService),
        provideFontAwesomeTesting(),
        provideTranslateMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPositionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Templates and State', () => {
    it('should assign templates to correct columns', () => {
      fixture.detectChanges();

      const columns = component.columns();

      expect(columns.find(c => c.field === 'actions')?.template).toBeTruthy();
      expect(columns.find(c => c.field === 'state')?.template).toBeTruthy();
      expect(columns.find(c => c.field === 'startDate')?.template).toBeTruthy();
      expect(columns.find(c => c.field === 'lastModifiedAt')?.template).toBeTruthy();

      expect(columns.find(c => c.field === 'avatar')?.template).toBeUndefined();
      expect(columns.find(c => c.field === 'professorName')?.template).toBeUndefined();
      expect(columns.find(c => c.field === 'title')?.template).toBeUndefined();
    });

    it('should correctly build stateTextMap from availableStatusOptions', () => {
      const map = component.stateTextMap();
      expect(map.DRAFT).toBe('jobState.draft');
      expect(map.PUBLISHED).toBe('jobState.published');
      expect(map.CLOSED).toBe('jobState.closed');
      expect(map.APPLICANT_FOUND).toBe('jobState.applicantFound');
    });
  });

  describe('Navigation', () => {
    it('should navigate to create job', () => {
      component.onCreateJob();
      expect(router.navigate).toHaveBeenCalledWith(['/job/create']);
    });

    it('should navigate to edit job', () => {
      component.onEditJob('123');
      expect(router.navigate).toHaveBeenCalledWith(['/job/edit/123']);
    });

    it('should log error when editing with empty id', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      component.onEditJob('');
      expect(spy).toHaveBeenCalled();
    });

    it('should navigate to view job', () => {
      component.onViewJob('321');
      expect(router.navigate).toHaveBeenCalledWith(['/job/detail/321']);
    });

    it('should log error when viewing with empty id', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      component.onViewJob('');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Search and Filters', () => {
    it('should handle onSearchEmit with new query', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.searchQuery.set('old');
      component.onSearchEmit('new');
      expect(component.page()).toBe(0);
      expect(component.searchQuery()).toBe('new');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should not reload if query is same after trim', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.searchQuery.set('same query');
      component.onSearchEmit('  same   query ');
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should trim and normalize whitespace in search query', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.onSearchEmit(' test multiple spaces here ');
      expect(component.searchQuery()).toBe('test multiple spaces here');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle filterEmit for status', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.onFilterEmit({ filterId: 'status', selectedValues: ['jobState.draft'] });
      expect(component.selectedStatusFilters()).toContain('DRAFT');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should ignore non-status filters', () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.selectedStatusFilters.set([]);

      component.onFilterEmit({ filterId: 'fieldOfStudies', selectedValues: ['CS'] });

      expect(component.selectedStatusFilters()).toEqual([]);
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should fallback to original key when translation key not found in mapTranslationKeysToEnumValues', () => {
      const result = (
        component as unknown as { mapTranslationKeysToEnumValues: (keys: string[]) => string[] }
      ).mapTranslationKeysToEnumValues(['unknownKey']);
      expect(result).toEqual(['unknownKey']);
    });
  });

  describe('Sorting and Pagination', () => {
    it('should handle loadOnSortEmit correctly', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.loadOnSortEmit({ field: 'title', direction: 'ASC' });
      expect(component.sortBy()).toBe('title');
      expect(component.sortDirection()).toBe('ASC');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should reset page on sort emit', () => {
      component.page.set(3);

      component.loadOnSortEmit({ field: 'title', direction: 'ASC' });

      expect(component.page()).toBe(0);
    });

    it('should handle loadOnTableEmit with pagination', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      const first = 20,
        rows = 10;
      component.loadOnTableEmit({ first, rows });
      expect(component.page()).toBe(Math.floor(first / rows));
      expect(component.pageSize()).toBe(rows);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle loadOnTableEmit when event.first and rows are undefined', async () => {
      const spy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      component.pageSize.set(5);
      component.loadOnTableEmit({});
      expect(component.page()).toBe(0);
      expect(component.pageSize()).toBe(5);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Load Jobs', () => {
    it('should load jobs successfully', async () => {
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
      expect(mockJobService.getJobsForCurrentResearchGroup).toHaveBeenCalled();
      expect(component.jobs().length).toBe(1);
      expect(component.totalRecords()).toBe(1);
    });

    it('should handle loadJobs API error', async () => {
      mockJobService.getJobsForCurrentResearchGroup.mockReturnValueOnce(throwError(() => new Error('fail')));
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('myPositionsPage.errors.loadJobs');
    });

    it('should return early from loadJobs when userId is empty', async () => {
      vi.spyOn(accountService, 'loadedUser').mockReturnValue({
        id: '',
        email: '',
        name: '',
      });
      const spy = vi.spyOn(mockJobService, 'getJobsForCurrentResearchGroup');
      spy.mockClear();
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set userId to empty string when loadedUser returns undefined', async () => {
      vi.spyOn(accountService, 'loadedUser').mockReturnValue(undefined);
      const spy = vi.spyOn(mockJobService, 'getJobsForCurrentResearchGroup');
      spy.mockClear();
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
      expect(component.userId()).toBe('');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should default jobs and totalRecords when API returns undefined content and totalElements', async () => {
      vi.spyOn(accountService, 'loadedUser').mockReturnValue({
        id: 'u1',
        email: '',
        name: '',
      });
      mockJobService.getJobsForCurrentResearchGroup.mockReturnValueOnce(
        of<PageCreatedJobDTO>({
          content: undefined,
          totalElements: undefined,
        }),
      );
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();

      expect(component.jobs()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
    });

    it('should call loadJobs with non-empty filters', async () => {
      vi.spyOn(accountService, 'loadedUser').mockReturnValue({
        id: 'u1',
        name: 'User',
        email: '',
      });
      component.selectedStatusFilters.set(['PUBLISHED']);

      const mockResponse: PageCreatedJobDTO = {
        content: [{ jobId: '123', title: 'Job Filtered', state: 'PUBLISHED' } as CreatedJobDTO],
        totalElements: 1,
      };

      const spy = vi.spyOn(mockJobService, 'getJobsForCurrentResearchGroup');
      spy.mockReturnValue(of(mockResponse));

      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();

      expect(spy).toHaveBeenCalledWith(
        component.pageSize(),
        component.page(),
        ['PUBLISHED'],
        component.sortBy(),
        component.sortDirection(),
        component.searchQuery(),
      );
      expect(component.jobs()).toEqual(mockResponse.content);
    });

    it('should update job order when sorted by title', async () => {
      vi.spyOn(accountService, 'loadedUser').mockReturnValue({ id: 'u1', name: 'User', email: '' });

      mockJobService.getJobsForCurrentResearchGroup.mockReturnValueOnce(
        of<PageCreatedJobDTO>({
          content: [
            { jobId: '2', title: 'Zebra', state: 'PUBLISHED' } as CreatedJobDTO,
            { jobId: '1', title: 'Alpha', state: 'DRAFT' } as CreatedJobDTO,
            { jobId: '3', title: 'Monkey', state: 'CLOSED' } as CreatedJobDTO,
          ],
          totalElements: 3,
        }),
      );
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
      expect(component.jobs().map(j => j.title)).toEqual(['Zebra', 'Alpha', 'Monkey']);

      component.loadOnSortEmit({ field: 'title', direction: 'ASC' });
      mockJobService.getJobsForCurrentResearchGroup.mockReturnValueOnce(
        of<PageCreatedJobDTO>({
          content: [
            { jobId: '1', title: 'Alpha', state: 'DRAFT' } as CreatedJobDTO,
            { jobId: '3', title: 'Monkey', state: 'CLOSED' } as CreatedJobDTO,
            { jobId: '2', title: 'Zebra', state: 'PUBLISHED' } as CreatedJobDTO,
          ],
          totalElements: 3,
        }),
      );
      await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
      expect(component.jobs().map(j => j.title)).toEqual(['Alpha', 'Monkey', 'Zebra']);
    });
  });

  describe('Job Actions', () => {
    it('should delete job successfully', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      await component.onDeleteJob('1');
      expect(mockJobService.deleteJob).toHaveBeenCalledWith('1');
      expect(mockToastService.showSuccessKey).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle delete job error', async () => {
      vi.spyOn(mockJobService, 'deleteJob').mockReturnValueOnce(throwError(() => new Error('delete failed')));
      await component.onDeleteJob('1');
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(
        'myPositionsPage.toastMessages.deleteJobFailed',
        expect.objectContaining({ detail: expect.stringContaining('delete failed') }),
      );
    });

    it('should close job successfully', async () => {
      const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
      await component.onCloseJob('1');
      expect(mockJobService.changeJobState).toHaveBeenCalledWith('1', 'CLOSED');
      expect(mockToastService.showSuccessKey).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle close job error', async () => {
      vi.spyOn(mockJobService, 'changeJobState').mockReturnValueOnce(throwError(() => new Error('close fail')));
      await component.onCloseJob('1');
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(
        'myPositionsPage.toastMessages.closeJobFailed',
        expect.objectContaining({ detail: expect.stringContaining('close fail') }),
      );
    });
  });

  describe('Confirm Actions', () => {
    it('should skip confirm edit when currentJobId is undefined', () => {
      const spy = vi.spyOn(component, 'onEditJob');
      component.currentJobId.set(undefined);

      component.onConfirmEdit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should skip confirm delete when currentJobId is empty', async () => {
      const spy = vi.spyOn(component, 'onDeleteJob').mockResolvedValue();
      component.currentJobId.set('');

      await component.onConfirmDelete();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should skip confirm close when currentJobId is empty', async () => {
      const spy = vi.spyOn(component, 'onCloseJob').mockResolvedValue();
      component.currentJobId.set('');

      await component.onConfirmClose();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should confirm edit when currentJobId is set', () => {
      const spy = vi.spyOn(component, 'onEditJob');
      component.currentJobId.set('job-1');

      component.onConfirmEdit();

      expect(spy).toHaveBeenCalledWith('job-1');
    });

    it('should confirm delete when currentJobId is set', async () => {
      const spy = vi.spyOn(component, 'onDeleteJob').mockResolvedValue();
      component.currentJobId.set('job-2');

      await component.onConfirmDelete();

      expect(spy).toHaveBeenCalledWith('job-2');
    });

    it('should confirm close when currentJobId is set', async () => {
      const spy = vi.spyOn(component, 'onCloseJob').mockResolvedValue();
      component.currentJobId.set('job-3');

      await component.onConfirmClose();

      expect(spy).toHaveBeenCalledWith('job-3');
    });
  });

  describe('Job Menu Items', () => {
    it('should build edit/delete menu items for draft jobs', () => {
      component.jobs.set([{ jobId: '1', state: 'DRAFT', title: 'Draft' } as CreatedJobDTO]);

      const items = component.jobMenuItems().get('1') ?? [];
      const labels = items.map(item => item.label);

      expect(labels).toEqual(['button.edit', 'button.delete']);
    });

    it('should invoke edit command for draft jobs', () => {
      const editSpy = vi.spyOn(component, 'onEditJob');
      component.jobs.set([{ jobId: '1', state: 'DRAFT', title: 'Draft' } as CreatedJobDTO]);

      const items = component.jobMenuItems().get('1') ?? [];
      items[0]?.command?.();

      expect(editSpy).toHaveBeenCalledWith('1');
    });

    it('should confirm edit for published jobs', () => {
      const confirmSpy = vi.fn();
      Object.defineProperty(component, 'editPublishedDialog', {
        value: () => ({ confirm: confirmSpy }),
      });
      component.jobs.set([{ jobId: '2', state: 'PUBLISHED', title: 'Published' } as CreatedJobDTO]);

      const items = component.jobMenuItems().get('2') ?? [];
      items[0]?.command?.();

      expect(component.currentJobId()).toBe('2');
      expect(confirmSpy).toHaveBeenCalledOnce();
      expect(confirmSpy).toHaveBeenCalledWith();
    });

    it('should confirm delete for draft jobs', () => {
      const confirmSpy = vi.fn();
      Object.defineProperty(component, 'deleteDialog', {
        value: () => ({ confirm: confirmSpy }),
      });
      component.jobs.set([{ jobId: '4', state: 'DRAFT', title: 'Draft' } as CreatedJobDTO]);

      const items = component.jobMenuItems().get('4') ?? [];
      items[1]?.command?.();

      expect(component.currentJobId()).toBe('4');
      expect(confirmSpy).toHaveBeenCalledOnce();
      expect(confirmSpy).toHaveBeenCalledWith();
    });

    it('should confirm close for published jobs', () => {
      const confirmSpy = vi.fn();
      Object.defineProperty(component, 'closeDialog', {
        value: () => ({ confirm: confirmSpy }),
      });
      component.jobs.set([{ jobId: '5', state: 'PUBLISHED', title: 'Published' } as CreatedJobDTO]);

      const items = component.jobMenuItems().get('5') ?? [];
      items[1]?.command?.();

      expect(component.currentJobId()).toBe('5');
      expect(confirmSpy).toHaveBeenCalledOnce();
      expect(confirmSpy).toHaveBeenCalledWith();
    });

    it('should build edit/close menu items for published jobs', () => {
      component.jobs.set([{ jobId: '2', state: 'PUBLISHED', title: 'Published' } as CreatedJobDTO]);

      const items = component.jobMenuItems().get('2') ?? [];
      const labels = items.map(item => item.label);

      expect(labels).toEqual(['button.edit', 'button.close']);
    });

    it('should omit menu items for closed jobs', () => {
      component.jobs.set([{ jobId: '3', state: 'CLOSED', title: 'Closed' } as CreatedJobDTO]);

      const items = component.jobMenuItems().get('3') ?? [];

      expect(items).toEqual([]);
    });
  });
});

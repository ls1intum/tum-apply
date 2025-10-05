import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, it, expect, vi, Mocked } from 'vitest';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MyPositionsPageComponent } from 'app/job/my-positions/my-positions-page.component';
import { ToastService } from 'app/service/toast-service';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { AccountService } from 'app/core/auth/account.service';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';

describe('MyPositionsPageComponent', () => {
  let fixture: ComponentFixture<MyPositionsPageComponent>;
  let component: MyPositionsPageComponent;

  let jobService: Mocked<JobResourceApiService>;
  let accountService: Mocked<AccountService>;
  let toastService: Mocked<ToastService>;
  let router: Mocked<Router>;

  beforeEach(async () => {
    jobService = {
      getAllJobNamesByProfessor: vi.fn().mockReturnValue(of(['A', 'B'])),
      getJobsByProfessor: vi.fn().mockReturnValue(
        of({
          content: [{ jobId: '1', title: 'Job A', state: 'DRAFT' }],
          totalElements: 1,
        }),
      ),
      deleteJob: vi.fn().mockReturnValue(of({})),
      changeJobState: vi.fn().mockReturnValue(of({})),
    } as unknown as Mocked<JobResourceApiService>;

    accountService = {
      loadedUser: vi.fn().mockReturnValue({ id: 'u1', name: 'User' }),
    } as unknown as Mocked<AccountService>;

    toastService = {
      showErrorKey: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
    } as unknown as Mocked<ToastService>;

    router = {
      navigate: vi.fn(),
    } as unknown as Mocked<Router>;

    await TestBed.configureTestingModule({
      imports: [MyPositionsPageComponent, TranslateModule.forRoot()],
      providers: [
        { provide: JobResourceApiService, useValue: jobService },
        { provide: AccountService, useValue: accountService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        provideFontAwesomeTesting(),
        provideTranslateMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPositionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all job names on init', async () => {
    await component.loadAllJobNames();
    expect(jobService.getAllJobNamesByProfessor).toHaveBeenCalled();
    expect(component.allJobNames()).toEqual(['A', 'B']);
  });

  it('should handle error when loading job names', async () => {
    jobService.getAllJobNamesByProfessor.mockReturnValueOnce(throwError(() => new Error('fail')));
    await component.loadAllJobNames();
    expect(toastService.showErrorKey).toHaveBeenCalledWith('myPositionsPage.errors.loadJobNames');
    expect(component.allJobNames()).toEqual([]);
  });

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

  it('should handle filterEmit for job', async () => {
    const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
    component.onFilterEmit({ filterId: 'job', selectedValues: ['AI'] });
    expect(component.selectedJobFilters()).toEqual(['AI']);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should handle filterEmit for status', async () => {
    const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
    component.onFilterEmit({ filterId: 'status', selectedValues: ['jobState.draft'] });
    expect(component.selectedStatusFilters()).toContain('DRAFT');
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should handle loadOnSortEmit correctly', async () => {
    const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
    component.loadOnSortEmit({ field: 'title', direction: 'ASC' });
    expect(component.sortBy()).toBe('title');
    expect(component.sortDirection()).toBe('ASC');
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should handle loadOnTableEmit with pagination', async () => {
    const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
    component.loadOnTableEmit({ first: 20, rows: 10 });
    expect(component.page()).toBe(2);
    expect(component.pageSize()).toBe(10);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should load jobs successfully', async () => {
    await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
    expect(jobService.getJobsByProfessor).toHaveBeenCalled();
    expect(component.jobs().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('should handle loadJobs API error', async () => {
    jobService.getJobsByProfessor.mockReturnValueOnce(throwError(() => new Error('fail')));
    await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
    expect(toastService.showErrorKey).toHaveBeenCalledWith('myPositionsPage.errors.loadJobs');
  });

  it('should delete job successfully', async () => {
    const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
    await component.onDeleteJob('1');
    expect(jobService.deleteJob).toHaveBeenCalledWith('1');
    expect(toastService.showSuccess).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should handle delete job error', async () => {
    vi.spyOn(jobService, 'deleteJob').mockReturnValueOnce(throwError(() => new Error('delete failed')));
    await component.onDeleteJob('1');
    expect(toastService.showError).toHaveBeenCalledWith({
      detail: expect.stringContaining('delete failed'),
    });
  });

  it('should close job successfully', async () => {
    const loadSpy = vi.spyOn(component as unknown as { loadJobs: () => Promise<void> }, 'loadJobs').mockResolvedValue();
    await component.onCloseJob('1');
    expect(jobService.changeJobState).toHaveBeenCalledWith('1', 'CLOSED');
    expect(toastService.showSuccess).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should handle close job error', async () => {
    vi.spyOn(jobService, 'changeJobState').mockReturnValueOnce(throwError(() => new Error('close fail')));
    await component.onCloseJob('1');
    expect(toastService.showError).toHaveBeenCalledWith({
      detail: expect.stringContaining('close fail'),
    });
  });

  it('should correctly build stateTextMap from availableStatusOptions', () => {
    const map = component.stateTextMap();
    expect(map.DRAFT).toBe('jobState.draft');
    expect(map.PUBLISHED).toBe('jobState.published');
    expect(map.CLOSED).toBe('jobState.closed');
    expect(map.APPLICANT_FOUND).toBe('jobState.applicantFound');
  });

  it('should return early from loadJobs when userId is empty', async () => {
    vi.spyOn(accountService, 'loadedUser').mockReturnValue({
      id: '',
      email: '',
      name: '',
    });
    const spy = vi.spyOn(jobService, 'getJobsByProfessor');
    await (component as unknown as { loadJobs: () => Promise<void> }).loadJobs();
    expect(spy).not.toHaveBeenCalled();
  });
});

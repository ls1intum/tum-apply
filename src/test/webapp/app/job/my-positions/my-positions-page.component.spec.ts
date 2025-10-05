import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MyPositionsPageComponent } from 'app/job/my-positions/my-positions-page.component';
import { ToastService } from 'app/service/toast-service';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { AccountService } from 'app/core/auth/account.service';

describe('MyPositionsPageComponent', () => {
  let fixture: ComponentFixture<MyPositionsPageComponent>;
  let component: MyPositionsPageComponent;
  let jobService: any;
  let accountService: any;
  let toastService: any;
  let router: any;

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
    };
    accountService = {
      loadedUser: vi.fn().mockReturnValue({ id: 'u1', name: 'User' }),
    };
    toastService = {
      showErrorKey: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MyPositionsPageComponent, TranslateModule.forRoot()],
      providers: [
        { provide: JobResourceApiService, useValue: jobService },
        { provide: AccountService, useValue: accountService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
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

  it('should navigate to create job on button click', () => {
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
    const spy = vi.spyOn(component as any, 'loadJobs').mockResolvedValue({});
    component.searchQuery.set('old');
    component.onSearchEmit('new');
    expect(component.page()).toBe(0);
    expect(component.searchQuery()).toBe('new');
    expect(spy).toHaveBeenCalled();
  });

  it('should not reload if query is same after trim', async () => {
    const spy = vi.spyOn(component as any, 'loadJobs').mockResolvedValue({});
    component.searchQuery.set('same query');
    component.onSearchEmit('  same   query ');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle filterEmit for job', async () => {
    const spy = vi.spyOn(component as any, 'loadJobs').mockResolvedValue({});
    component.onFilterEmit({ filterId: 'job', selectedValues: ['AI'] });
    expect(component.selectedJobFilters()).toEqual(['AI']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle filterEmit for status', async () => {
    const spy = vi.spyOn(component as any, 'loadJobs').mockResolvedValue({});
    component.onFilterEmit({ filterId: 'status', selectedValues: ['jobState.draft'] });
    expect(component.selectedStatusFilters()).toContain('DRAFT');
    expect(spy).toHaveBeenCalled();
  });

  it('should handle loadOnSortEmit correctly', async () => {
    const spy = vi.spyOn(component as any, 'loadJobs').mockResolvedValue({});
    component.loadOnSortEmit({ field: 'title', direction: 'ASC' });
    expect(component.sortBy()).toBe('title');
    expect(component.sortDirection()).toBe('ASC');
    expect(spy).toHaveBeenCalled();
  });

  it('should handle loadOnTableEmit with pagination', async () => {
    const spy = vi.spyOn(component as any, 'loadJobs').mockResolvedValue({});
    component.loadOnTableEmit({ first: 20, rows: 10 });
    expect(component.page()).toBe(2);
    expect(component.pageSize()).toBe(10);
    expect(spy).toHaveBeenCalled();
  });

  it('should load jobs successfully', async () => {
    await (component as any).loadJobs();
    expect(jobService.getJobsByProfessor).toHaveBeenCalled();
    expect(component.jobs().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('should handle missing user id and skip job loading', async () => {
    accountService.loadedUser.mockReturnValueOnce(undefined);
    await (component as any).loadJobs();
    expect(jobService.getJobsByProfessor).not.toHaveBeenCalled();
  });

  it('should handle loadJobs API error', async () => {
    jobService.getJobsByProfessor.mockReturnValueOnce(throwError(() => new Error('fail')));
    await (component as any).loadJobs();
    expect(toastService.showErrorKey).toHaveBeenCalledWith('myPositionsPage.errors.loadJobs');
  });

  it('should delete job successfully', async () => {
    const spy = vi.spyOn(component as any, 'loadJobs').mockResolvedValue({});
    await component.onDeleteJob('1');
    expect(jobService.deleteJob).toHaveBeenCalledWith('1');
    expect(toastService.showSuccess).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should handle delete job error', async () => {
    jobService.deleteJob.mockReturnValueOnce(throwError(() => new Error('delete failed')));
    await component.onDeleteJob('1');
    expect(toastService.showError).toHaveBeenCalledWith({ detail: expect.stringContaining('delete failed') });
  });

  it('should close job successfully', async () => {
    const spy = vi.spyOn(component as any, 'loadJobs').mockResolvedValue({});
    await component.onCloseJob('1');
    expect(jobService.changeJobState).toHaveBeenCalledWith('1', 'CLOSED');
    expect(toastService.showSuccess).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should handle close job error', async () => {
    jobService.changeJobState.mockReturnValueOnce(throwError(() => new Error('close fail')));
    await component.onCloseJob('1');
    expect(toastService.showError).toHaveBeenCalledWith({ detail: expect.stringContaining('close fail') });
  });
});

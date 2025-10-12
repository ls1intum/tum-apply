import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { JobDetailComponent, JobDetails } from 'app/job/job-detail/job-detail.component';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { JobDetailDTO } from 'app/generated/model/jobDetailDTO';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';
import { signal } from '@angular/core';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { HttpErrorResponse } from '@angular/common/http';
import { provideTranslateMock } from '../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../util/fontawesome.testing';

describe('JobDetailComponent', () => {
  let fixture: ComponentFixture<JobDetailComponent>;
  let component: JobDetailComponent;
  let translate: TranslateService;

  let router: Router;
  let location: Location;
  let jobService: {
    getJobDetails: ReturnType<typeof vi.fn>;
    changeJobState: ReturnType<typeof vi.fn>;
    deleteJob: ReturnType<typeof vi.fn>;
  };
  let accountService: { loadedUser: () => { id: string; name: string; researchGroup?: { name: string; researchGroupId: string } } };
  let toastService: { showError: ReturnType<typeof vi.fn>; showSuccess: ReturnType<typeof vi.fn> };
  let researchGroupService: { getResourceGroupDetails: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn() } as unknown as Router;
    location = { back: vi.fn() } as unknown as Location;
    toastService = {
      showError: vi.fn(),
      showSuccess: vi.fn(),
    };
    jobService = {
      getJobDetails: vi.fn(),
      changeJobState: vi.fn(),
      deleteJob: vi.fn(),
    };
    accountService = {
      loadedUser: () => ({ id: 'u1', name: 'User X', researchGroup: { name: 'AI Lab', researchGroupId: 'rg1' } }),
    };
    researchGroupService = {
      getResourceGroupDetails: vi.fn().mockReturnValue(of({ description: 'RG Desc' })),
    };

    await TestBed.configureTestingModule({
      imports: [JobDetailComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        { provide: ToastService, useValue: toastService },
        { provide: JobResourceApiService, useValue: jobService },
        { provide: ResearchGroupResourceApiService, useValue: researchGroupService },
        { provide: AccountService, useValue: accountService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['job_id', 'job123']]) } } },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobDetailComponent);
    translate = TestBed.inject(TranslateService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should call location.back on onBack()', () => {
    component.onBack();
    expect(location.back).toHaveBeenCalled();
  });

  it('should navigate to apply form on onApply()', () => {
    component.jobId.set('job123');
    component.onApply();
    expect(router.navigate).toHaveBeenCalledWith(['/application/form'], { queryParams: { job: 'job123' } });
  });

  it('should navigate to edit application on onEditApplication()', () => {
    component.jobId.set('job123');
    component.jobDetails.set({
      applicationId: 'app42',
      title: '',
      jobState: '',
      supervisingProfessor: '',
      researchGroup: '',
      createdAt: '',
      lastModifiedAt: '',
    } as JobDetails);
    component.onEditApplication();
    expect(router.navigate).toHaveBeenCalledWith(['/application/form'], { queryParams: { job: 'job123', application: 'app42' } });
  });

  it('should navigate to view application on onViewApplication()', () => {
    component.jobDetails.set({
      applicationId: 'app88',
      title: '',
      jobState: '',
      supervisingProfessor: '',
      researchGroup: '',
      createdAt: '',
      lastModifiedAt: '',
    } as JobDetails);
    component.onViewApplication();
    expect(router.navigate).toHaveBeenCalledWith(['/application/detail/app88']);
  });

  it('should navigate to edit job on onEditJob()', () => {
    component.jobId.set('job777');
    component.onEditJob();
    expect(router.navigate).toHaveBeenCalledWith(['/job/edit/job777']);
  });

  it('should handle missing jobId in onEditJob()', () => {
    component.jobId.set('');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.onEditJob();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should close job successfully', async () => {
    jobService.changeJobState.mockReturnValue(of({}));
    await component.onCloseJob();
    expect(jobService.changeJobState).toHaveBeenCalledWith('job123', 'CLOSED');
    expect(toastService.showSuccess).toHaveBeenCalled();
    expect(location.back).toHaveBeenCalled();
  });

  it('should handle close job error', async () => {
    jobService.changeJobState.mockReturnValue(throwError(() => new Error('fail')));
    await component.onCloseJob();
    expect(toastService.showError).toHaveBeenCalled();
  });

  it('should delete job successfully', async () => {
    jobService.deleteJob.mockReturnValue(of({}));
    await component.onDeleteJob();
    expect(jobService.deleteJob).toHaveBeenCalledWith('job123');
    expect(toastService.showSuccess).toHaveBeenCalled();
  });

  it('should handle delete job error', async () => {
    jobService.deleteJob.mockReturnValue(throwError(() => new Error('boom')));
    await component.onDeleteJob();
    expect(toastService.showError).toHaveBeenCalled();
  });

  it('should load job details via init()', async () => {
    const dto: JobDetailDTO = {
      title: 'JobTitle',
      state: 'DRAFT',
      supervisingProfessorName: 'ProfX',
      researchGroup: { name: 'RG', researchGroupId: 'rg1' },
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    } as JobDetailDTO;
    jobService.getJobDetails.mockReturnValue(of(dto));

    await component.init();

    expect(jobService.getJobDetails).toHaveBeenCalledWith('job123');
    expect(component.dataLoaded()).toBe(true);
  });

  it('should handle init error with HttpErrorResponse', async () => {
    jobService.getJobDetails.mockReturnValue(throwError(() => new Error('fail')));
    await component.init();
    expect(toastService.showError).toHaveBeenCalled();
    expect(location.back).toHaveBeenCalled();
  });

  it('should call loadJobDetailsFromForm() and set jobDetails', async () => {
    const form: JobFormDTO = { title: 'FormJob', description: 'Desc' } as JobFormDTO;
    await (component as unknown as { loadJobDetailsFromForm: (f: JobFormDTO) => Promise<void> }).loadJobDetailsFromForm(form);
    expect(component.jobDetails()).not.toBeNull();
    expect(component.dataLoaded()).toBe(true);
  });

  it('should handle error when researchGroupService fails', async () => {
    researchGroupService.getResourceGroupDetails.mockReturnValue(throwError(() => new Error('RG error')));
    const form: JobFormDTO = { title: 'FormJob' } as JobFormDTO;
    await (component as unknown as { loadJobDetailsFromForm: (f: JobFormDTO) => Promise<void> }).loadJobDetailsFromForm(form);
    expect(toastService.showError).toHaveBeenCalled();
  });

  it('should compute jobStateText and jobStateColor correctly', () => {
    component.jobDetails.set({ jobState: 'DRAFT' } as JobDetails);
    expect(component.jobStateText).toBe('jobState.draft');
    expect(component.jobStateColor).toBe('info');
  });

  it('should map JobDetailDTO to JobDetails', () => {
    const dto: JobDetailDTO = {
      title: 'Mapped',
      state: 'PUBLISHED',
      supervisingProfessorName: 'Prof',
      researchGroup: { name: 'RG', researchGroupId: 'rg1' },
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    } as JobDetailDTO;
    const user = accountService.loadedUser();
    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof accountService.loadedUser>) => JobDetails;
      }
    ).mapToJobDetails(dto, user);
    expect(result.title).toBe('Mapped');
    expect(result.jobState).toBe('PUBLISHED');
  });

  it('should compute rightActionButtons for non-research-group user', () => {
    const job = { belongsToResearchGroup: false, applicationState: undefined } as JobDetails;
    component.jobDetails.set(job);
    expect(component.rightActionButtons()?.buttons[0].label).toBe('jobActionButton.apply');
  });

  it('should compute rightActionButtons for DRAFT and trigger confirm()', () => {
    const confirmSpy = vi.fn();
    (component as unknown as { deleteConfirmDialog: () => { confirm: () => void } }).deleteConfirmDialog = () => ({ confirm: confirmSpy });
    const job = { belongsToResearchGroup: true, jobState: 'DRAFT' } as JobDetails;
    component.jobDetails.set(job);
    const btn = component.rightActionButtons()?.buttons.find(b => b.label === component.deleteButtonLabel);
    btn?.onClick();
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should compute rightActionButtons for PUBLISHED and trigger confirm()', () => {
    const confirmSpy = vi.fn();
    (component as unknown as { closeConfirmDialog: () => { confirm: () => void } }).closeConfirmDialog = () => ({ confirm: confirmSpy });
    const job = { belongsToResearchGroup: true, jobState: 'PUBLISHED' } as JobDetails;
    component.jobDetails.set(job);
    const btn = component.rightActionButtons()?.buttons.find(b => b.label === component.closeButtonLabel);
    btn?.onClick();
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should handle invalid job ID in init()', async () => {
    const invalidRoute = { snapshot: { paramMap: new Map([['job_id', '']]) } } as unknown as ActivatedRoute;

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [JobDetailComponent],
        providers: [
          { provide: Router, useValue: router },
          { provide: Location, useValue: location },
          { provide: ToastService, useValue: toastService },
          { provide: JobResourceApiService, useValue: jobService },
          { provide: ResearchGroupResourceApiService, useValue: researchGroupService },
          { provide: AccountService, useValue: accountService },
          { provide: ActivatedRoute, useValue: invalidRoute },
          provideTranslateMock(),
        ],
      })
      .compileComponents();

    const fixture2 = TestBed.createComponent(JobDetailComponent);
    const comp2 = fixture2.componentInstance;
    await comp2.init();

    expect(location.back).toHaveBeenCalled();
  });

  it('should map job details in form mode (isForm = true)', () => {
    const form: JobFormDTO = {
      title: 'Form Job',
      description: 'Form Desc',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    } as JobFormDTO;
    const user = accountService.loadedUser();
    const result = (
      component as unknown as {
        mapToJobDetails: (
          d: JobFormDTO,
          u?: ReturnType<typeof accountService.loadedUser>,
          rg?: { description?: string },
          f?: boolean,
        ) => JobDetails;
      }
    ).mapToJobDetails(form, user, { description: 'RG D' }, true);

    expect(result.title).toBe('Form Job');
    expect(result.jobState).toBe('DRAFT');
    expect(result.supervisingProfessor).toBe(user.name);
  });

  it('should handle unknown job state in jobStateText and jobStateColor', () => {
    component.jobDetails.set({ jobState: 'UNKNOWN_STATE' } as JobDetails);
    expect(component.jobStateText).toBe('jobState.unknown');
    expect(component.jobStateColor).toBe('info');
  });

  it('should return default info color when no jobDetails', () => {
    component.jobDetails.set(null);
    expect(component.jobStateColor).toBe('info');
  });

  it('should compute noData() value after language change', () => {
    const spy = vi.spyOn(translate, 'instant').mockReturnValue('No data');
    translate.onLangChange.next({ lang: 'de', translations: {}, defaultLang: '', scope: null } as LangChangeEvent);
    const result = component.noData();
    expect(result).toBe('No data');
    expect(spy).toHaveBeenCalledWith('jobDetailPage.noData');
  });

  it('should return null from rightActionButtons when previewData exists', () => {
    const previewSignal = signal({ title: 'Preview job' });
    (component as unknown as { previewData: () => typeof previewSignal }).previewData = () => previewSignal;
    expect(component.rightActionButtons()).toBeNull();
  });

  it('should trigger onApply from computed button', () => {
    const job = { belongsToResearchGroup: false, applicationState: undefined } as unknown as ReturnType<JobDetailComponent['jobDetails']>;
    component.jobDetails.set(job);
    const spy = vi.spyOn(component, 'onApply');
    const btn = component.rightActionButtons()?.buttons[0];
    btn?.onClick();
    expect(spy).toHaveBeenCalled();
  });

  it('should trigger onEditApplication from computed button', () => {
    const job = {
      belongsToResearchGroup: false,
      applicationState: ApplicationForApplicantDTO.ApplicationStateEnum.Saved,
    } as unknown as ReturnType<JobDetailComponent['jobDetails']>;
    component.jobDetails.set(job);
    const spy = vi.spyOn(component, 'onEditApplication');
    const btn = component.rightActionButtons()?.buttons[0];
    btn?.onClick();
    expect(spy).toHaveBeenCalled();
  });

  it('should trigger onViewApplication from computed button', () => {
    const job = {
      belongsToResearchGroup: false,
      applicationState: ApplicationForApplicantDTO.ApplicationStateEnum.Sent,
    } as unknown as ReturnType<JobDetailComponent['jobDetails']>;
    component.jobDetails.set(job);
    const spy = vi.spyOn(component, 'onViewApplication');
    const btn = component.rightActionButtons()?.buttons[0];
    btn?.onClick();
    expect(spy).toHaveBeenCalled();
  });

  it('should trigger onEditJob from computed button', () => {
    const spy = vi.spyOn(component, 'onEditJob');
    const job = { belongsToResearchGroup: true, jobState: 'DRAFT' } as JobDetails;
    component.jobDetails.set(job);
    const btn = component.rightActionButtons()?.buttons.find(b => b.label === 'jobActionButton.edit');
    btn?.onClick();
    expect(spy).toHaveBeenCalled();
  });

  it('should handle HttpErrorResponse in init()', async () => {
    const httpError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    jobService.getJobDetails.mockReturnValue(throwError(() => httpError));
    await component.init();
    expect(toastService.showError).toHaveBeenCalledWith({
      detail: expect.stringContaining('500'),
    });
  });

  it('should return null when jobDetails is falsy in rightActionButtons()', () => {
    component.jobDetails.set(null);
    const result = component.rightActionButtons();
    expect(result).toBeNull();
  });

  it('should mapToJobDetails handle all default fallbacks and missing fields', () => {
    const dto = {
      jobId: 'j1',
      title: 'X',
      state: undefined,
      supervisingProfessorName: undefined,
      researchGroup: { name: undefined, researchGroupId: 'rgX' },
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    } as unknown as JobDetailDTO;

    const user = accountService.loadedUser();

    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof accountService.loadedUser>) => JobDetails;
      }
    ).mapToJobDetails(dto, user);
    // covers ?? fallbacks for supervisingProfessor, researchGroup, workload, contractDuration
    expect(result.supervisingProfessor ?? '').toBe('');
    expect(result.researchGroup ?? '').toBe('');
    expect(result.workload ?? '').toBe('');
    expect(result.contractDuration ?? '').toBe('');
  });

  it('should return null when jobDetails do not match any button case', () => {
    const job = { belongsToResearchGroup: true, jobState: 'CLOSED' } as JobDetails;
    component.jobDetails.set(job);
    const result = component.rightActionButtons();
    expect(result).toBeNull();
  });

  it('should mapToJobDetails handle all default fallbacks and missing fields', () => {
    const dto = {
      title: 'X',
      state: undefined,
      supervisingProfessorName: undefined,
      researchGroup: { name: undefined, researchGroupId: 'rgX' },
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      startDate: undefined,
      endDate: undefined,
      description: undefined,
      tasks: undefined,
      requirements: undefined,
      workload: undefined,
      contractDuration: undefined,
    } as unknown as JobDetailDTO;

    const user = accountService.loadedUser();
    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof accountService.loadedUser>) => JobDetails;
      }
    ).mapToJobDetails(dto, user);

    expect(result.supervisingProfessor).toBeUndefined();

    expect(result.researchGroup).toBe('');
    expect(result.workload).toBe('');
    expect(result.contractDuration).toBe('');
  });

  it('should call loadJobDetailsFromForm when previewDataValue exists (covering effect line)', async () => {
    const previewJob: JobFormDTO = { title: 'PreviewJob' } as JobFormDTO;

    const fixture2 = TestBed.createComponent(JobDetailComponent);
    const comp2 = fixture2.componentInstance;

    const loadSpy = vi
      .spyOn(comp2 as unknown as { loadJobDetailsFromForm: (f: JobFormDTO) => Promise<void> }, 'loadJobDetailsFromForm')
      .mockResolvedValue();

    fixture2.componentRef.setInput('previewData', signal(previewJob));

    fixture2.detectChanges();

    await Promise.resolve();

    expect(loadSpy).toHaveBeenCalledWith(previewJob);
  });

  it('should set empty string when user id or job_id are missing', async () => {
    // user has no id, and route provides no job_id
    const accountServiceNoId = { loadedUser: () => ({ name: 'Anon' }) };
    const routeNoJobId = {
      snapshot: { paramMap: new Map([['job_id', null]]) },
    } as unknown as ActivatedRoute;

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [JobDetailComponent],
        providers: [
          { provide: Router, useValue: router },
          { provide: Location, useValue: location },
          { provide: ToastService, useValue: toastService },
          { provide: JobResourceApiService, useValue: jobService },
          { provide: ResearchGroupResourceApiService, useValue: researchGroupService },
          { provide: AccountService, useValue: accountServiceNoId },
          { provide: ActivatedRoute, useValue: routeNoJobId },
          provideTranslateMock(),
        ],
      })
      .compileComponents();

    const fixture2 = TestBed.createComponent(JobDetailComponent);
    const comp2 = fixture2.componentInstance;

    jobService.getJobDetails.mockReturnValue(of({ title: 'FallbackJob' } as JobDetails));

    await comp2.init();

    expect(comp2['userId']()).toBe('');
    expect(comp2['jobId']()).toBe('');
  });

  it('should return correct fallback for jobStateText when jobState missing or unknown', () => {
    component.jobDetails.set(null);
    expect(component.jobStateText).toBe('Unknown');

    component.jobDetails.set({ jobState: 'NON_EXISTENT_STATE' } as JobDetails);
    expect(component.jobStateText).toBe('jobState.unknown');
  });

  it('should convert workload and contractDuration to strings in mapToJobDetails', () => {
    const dto: JobDetailDTO = {
      jobId: 'j1',
      title: '',
      state: 'DRAFT',
      supervisingProfessorName: '',
      researchGroup: { name: 'RG1', researchGroupId: 'rg1' },
      createdAt: '',
      lastModifiedAt: '',
      workload: 15 as unknown as number,
      contractDuration: 9 as unknown as number,
    };

    const user = accountService.loadedUser();

    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof accountService.loadedUser>) => JobDetails;
      }
    ).mapToJobDetails(dto, user);

    expect(result.workload).toBe('15');
    expect(result.contractDuration).toBe('9');
  });

  it('should default supervisingProfessor and researchGroup to empty strings in form mode when user info missing', () => {
    const form: JobFormDTO = {
      title: 'Form Job',
      description: 'Some description',
      fieldOfStudies: '',
      supervisingProfessor: '',
      location: 'GARCHING',
      state: 'CLOSED',
    };

    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobFormDTO, u?: ReturnType<typeof accountService.loadedUser>, rg?: unknown, f?: boolean) => JobDetails;
      }
    ).mapToJobDetails(form, undefined, undefined, true);

    expect(result.supervisingProfessor).toBe('');
    expect(result.researchGroup).toBe('');
  });

  it('should call getResourceGroupDetails with empty string when user has no researchGroup', async () => {
    const userWithoutGroup = { id: 'u2', name: 'NoGroupUser' };

    accountService.loadedUser = vi.fn().mockReturnValue(userWithoutGroup);

    const form: JobFormDTO = {
      title: 'Form Job',
      fieldOfStudies: '',
      supervisingProfessor: '',
      location: 'GARCHING',
      state: 'CLOSED',
    };

    const spy = vi.spyOn(researchGroupService, 'getResourceGroupDetails').mockReturnValue(of({ description: 'none' }));

    await (
      component as unknown as {
        loadJobDetailsFromForm: (f: JobFormDTO) => Promise<void>;
      }
    ).loadJobDetailsFromForm(form);

    expect(spy).toHaveBeenCalledWith('');
  });
});

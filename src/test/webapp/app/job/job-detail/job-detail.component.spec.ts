import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

import { JobDetailComponent, JobDetails } from 'app/job/job-detail/job-detail.component';
import { JhiMenuItem } from 'app/shared/components/atoms/menu/menu.component';
import { User } from 'app/core/auth/account.service';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { JobDetailDTO } from 'app/generated/model/jobDetailDTO';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';
import { signal } from '@angular/core';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideTranslateMock } from '../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../util/fontawesome.testing';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createRouterMock, provideRouterMock } from '../../../util/router.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';
import { PdfExportResourceApiService } from 'app/generated/api/pdfExportResourceApi.service';

describe('JobDetailComponent', () => {
  let fixture: ComponentFixture<JobDetailComponent>;
  let component: JobDetailComponent;
  let translate: TranslateService;

  const mockRouter = createRouterMock();

  let location: Location;
  let jobService: {
    getJobDetails: ReturnType<typeof vi.fn>;
    changeJobState: ReturnType<typeof vi.fn>;
    deleteJob: ReturnType<typeof vi.fn>;
  };
  let mockAccountService: ReturnType<typeof createAccountServiceMock>;
  let mockToastService = createToastServiceMock();
  let researchGroupService: { getResourceGroupDetails: ReturnType<typeof vi.fn> };
  let pdfExportService: {
    exportJobToPDF: ReturnType<typeof vi.fn>;
    exportJobPreviewToPDF: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    location = { back: vi.fn() } as unknown as Location;
    jobService = {
      getJobDetails: vi.fn(),
      changeJobState: vi.fn(),
      deleteJob: vi.fn(),
    };
    mockAccountService = createAccountServiceMock();

    researchGroupService = {
      getResourceGroupDetails: vi.fn().mockReturnValue(of({ description: 'RG Desc' })),
    };

    pdfExportService = {
      exportJobToPDF: vi.fn(),
      exportJobPreviewToPDF: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [JobDetailComponent],
      providers: [
        { provide: Location, useValue: location },
        { provide: JobResourceApiService, useValue: jobService },
        { provide: ResearchGroupResourceApiService, useValue: researchGroupService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['job_id', 'job123']]) } } },
        { provide: PdfExportResourceApiService, useValue: pdfExportService },
        provideToastServiceMock(mockToastService),
        provideRouterMock(mockRouter),
        provideAccountServiceMock(mockAccountService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobDetailComponent);
    translate = TestBed.inject(TranslateService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to apply form on onApply()', () => {
    component.jobId.set('job123');
    component.onApply();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/application/form'], { queryParams: { job: 'job123' } });
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
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/application/form'], { queryParams: { job: 'job123', application: 'app42' } });
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
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/application/detail/app88']);
  });

  it('should navigate to edit job on onEditJob()', () => {
    component.jobId.set('job777');
    component.onEditJob();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/job/edit/job777']);
  });

  it('should handle missing jobId in onEditJob()', () => {
    component.jobId.set('');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.onEditJob();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return false in hasResearchGroupDescription when description is missing', () => {
    component.jobDetails.set({ researchGroupDescription: undefined } as unknown as JobDetails);
    expect(component.hasResearchGroupDescription()).toBe(false);
  });

  it('should return false when description contains only empty HTML tags', () => {
    component.jobDetails.set({ researchGroupDescription: '<p><br></p>' } as JobDetails);
    expect(component.hasResearchGroupDescription()).toBe(false);
  });

  it('should return true when description contains text inside HTML', () => {
    component.jobDetails.set({ researchGroupDescription: '<p>Hello</p>' } as JobDetails);
    expect(component.hasResearchGroupDescription()).toBe(true);
  });

  it('should navigate to research group info on onEditResearchGroup()', () => {
    const navigateSpy = vi.spyOn(mockRouter, 'navigate');
    component.onEditResearchGroup();
    expect(navigateSpy).toHaveBeenCalledWith(['/research-group/info']);
  });

  it('should call trimWebsiteUrl util function', () => {
    const url = 'https://example.com';
    const result = component.trimWebsiteUrl(url);
    expect(result).toBe('example.com');
  });

  it('should close job successfully', async () => {
    jobService.changeJobState.mockReturnValue(of({}));
    await component.onCloseJob();
    expect(jobService.changeJobState).toHaveBeenCalledWith('job123', 'CLOSED');
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(location.back).toHaveBeenCalled();
  });

  it('should handle close job error', async () => {
    jobService.changeJobState.mockReturnValue(throwError(() => new Error('fail')));
    await component.onCloseJob();
    expect(mockToastService.showError).toHaveBeenCalled();
  });

  it('should delete job successfully', async () => {
    jobService.deleteJob.mockReturnValue(of({}));
    await component.onDeleteJob();
    expect(jobService.deleteJob).toHaveBeenCalledWith('job123');
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  });

  it('should handle delete job error', async () => {
    jobService.deleteJob.mockReturnValue(throwError(() => new Error('boom')));
    await component.onDeleteJob();
    expect(mockToastService.showError).toHaveBeenCalled();
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
    expect(mockToastService.showError).toHaveBeenCalled();
    expect(location.back).toHaveBeenCalled();
  });

  it('should call loadJobDetailsFromForm() and set jobDetails', async () => {
    const form: JobFormDTO = { title: 'FormJob', jobDescriptionEN: 'Desc', jobDescriptionDE: 'Desc' } as JobFormDTO;
    await (component as unknown as { loadJobDetailsFromForm: (f: JobFormDTO) => Promise<void> }).loadJobDetailsFromForm(form);
    expect(component.jobDetails()).not.toBeNull();
    expect(component.dataLoaded()).toBe(true);
  });

  it('should handle error when researchGroupService fails', async () => {
    researchGroupService.getResourceGroupDetails.mockReturnValue(throwError(() => new Error('RG error')));
    const form: JobFormDTO = { title: 'FormJob' } as JobFormDTO;
    await (component as unknown as { loadJobDetailsFromForm: (f: JobFormDTO) => Promise<void> }).loadJobDetailsFromForm(form);
    expect(mockToastService.showError).toHaveBeenCalled();
  });

  it('should compute jobStateText and jobStateColor correctly', () => {
    component.jobDetails.set({ jobState: 'DRAFT' } as JobDetails);
    expect(component.jobStateText()).toBe('jobState.draft');
    expect(component.jobStateColor()).toBe('info');
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
    const user = mockAccountService.loadedUser();
    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof mockAccountService.loadedUser>) => JobDetails;
      }
    ).mapToJobDetails(dto, user);
    expect(result.title).toBe('Mapped');
    expect(result.jobState).toBe('PUBLISHED');
  });

  it('should compute primaryActionButton for non-research-group user', () => {
    const job = { belongsToResearchGroup: false, applicationState: undefined } as JobDetails;
    component.jobDetails.set(job);
    expect(component.primaryActionButton()?.label).toBe('button.apply');
  });

  it('should compute getMenuItems for DRAFT and trigger confirm()', () => {
    const confirmSpy = vi.fn();
    (component as unknown as { deleteConfirmDialog: () => { confirm: () => void } }).deleteConfirmDialog = () => ({ confirm: confirmSpy });
    const job = { belongsToResearchGroup: true, jobState: 'DRAFT' } as JobDetails;
    component.jobDetails.set(job);
    const menuItems = component.menuItems();
    const deleteItem = menuItems.find((item: JhiMenuItem) => item.label === component.deleteButtonLabel);
    deleteItem?.command?.();
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should compute primaryActionButton for PUBLISHED and trigger confirm()', () => {
    const confirmSpy = vi.fn();
    (component as unknown as { closeConfirmDialog: () => { confirm: () => void } }).closeConfirmDialog = () => ({ confirm: confirmSpy });
    // mock professor ownership
    vi.spyOn(component, 'isProfessorOrEmployee').mockReturnValue(true);
    const job = { belongsToResearchGroup: true, jobState: 'PUBLISHED' } as JobDetails;
    component.jobDetails.set(job);
    const btn = component.primaryActionButton();
    btn?.onClick();
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should return null for PUBLISHED job when user is professor but not owner', () => {
    vi.spyOn(component, 'isProfessorOrEmployee').mockReturnValue(true);

    const job = {
      belongsToResearchGroup: false,
      jobState: 'PUBLISHED',
    } as JobDetails;

    component.jobDetails.set(job);
    expect(component.primaryActionButton()).toBeNull();
  });

  it('should handle invalid job ID in init()', async () => {
    const invalidRoute = { snapshot: { paramMap: new Map([['job_id', '']]) } } as unknown as ActivatedRoute;

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [JobDetailComponent],
        providers: [
          { provide: Location, useValue: location },
          { provide: JobResourceApiService, useValue: jobService },
          { provide: ResearchGroupResourceApiService, useValue: researchGroupService },
          { provide: ActivatedRoute, useValue: invalidRoute },
          provideToastServiceMock(mockToastService),
          provideRouterMock(mockRouter),
          provideAccountServiceMock(mockAccountService),
          provideTranslateMock(),
          provideHttpClient(),
        ],
      })
      .compileComponents();

    const fixture2 = TestBed.createComponent(JobDetailComponent);
    const comp2 = fixture2.componentInstance;
    await comp2.init();

    expect(location.back).toHaveBeenCalled();
  });

  it('isOwnerOfJob should return false when user missing', () => {
    mockAccountService.user.set(null as any);
    const result = (component as any).isOwnerOfJob({ belongsToResearchGroup: true } as JobDetails);
    expect(result).toBe(false);
  });

  it('isOwnerOfJob should return false when not professor', () => {
    vi.spyOn(component, 'isProfessorOrEmployee').mockReturnValue(false);
    const result = (component as any).isOwnerOfJob({ belongsToResearchGroup: true } as JobDetails);
    expect(result).toBe(false);
  });

  it('isOwnerOfJob should return false when job does not belong to research group', () => {
    vi.spyOn(component, 'isProfessorOrEmployee').mockReturnValue(true);
    const result = (component as any).isOwnerOfJob({ belongsToResearchGroup: false } as JobDetails);
    expect(result).toBe(false);
  });

  it('should override researchGroup fields from researchGroupDetails in form mode', () => {
    const form: JobFormDTO = { title: 'Test' } as JobFormDTO;

    const result = (component as any).mapToJobDetails(form, undefined, { email: 'x@test.de', street: 'Main St', city: 'X' }, true);

    expect(result.researchGroupEmail).toBe('x@test.de');
    expect(result.researchGroupStreet).toBe('Main St');
    expect(result.researchGroupCity).toBe('X');
  });

  it('should map job details in form mode (isForm = true)', () => {
    const form: JobFormDTO = {
      title: 'Form Job',
      jobDescriptionEN: 'Form Desc',
      jobDescriptionDE: 'Form Desc',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    } as JobFormDTO;
    const user = mockAccountService.loadedUser();
    const result = (
      component as unknown as {
        mapToJobDetails: (
          d: JobFormDTO,
          u?: ReturnType<typeof mockAccountService.loadedUser>,
          rg?: { jobDescriptionEN?: string },
          rh?: { jobDescriptionDE?: string },
          f?: boolean,
        ) => JobDetails;
      }
    ).mapToJobDetails(form, user, { jobDescriptionEN: 'RG D' }, { jobDescriptionDE: 'RG D' }, true);

    expect(result.title).toBe('Form Job');
    expect(result.jobState).toBe('DRAFT');
    expect(result.supervisingProfessor).toBe(user?.name);
  });

  it('should handle unknown job state in jobStateText and jobStateColor', () => {
    component.jobDetails.set({ jobState: 'UNKNOWN_STATE' } as JobDetails);
    expect(component.jobStateText()).toBe('jobState.unknown');
    expect(component.jobStateColor()).toBe('info');
  });

  it('should return default info color when no jobDetails', () => {
    component.jobDetails.set(null);
    expect(component.jobStateColor()).toBe('info');
  });

  it('should compute noData() value after language change', () => {
    const spy = vi.spyOn(translate, 'instant').mockReturnValue('No data');
    translate.use('de');
    const result = component.noData();
    expect(result).toBe('No data');
    expect(spy).toHaveBeenCalledWith('jobDetailPage.noData');
  });

  it('should return English job description when current language is en', () => {
    const job = { jobDescriptionEN: '<p>English</p>', jobDescriptionDE: '<p>Deutsch</p>' } as JobDetails;
    translate.use('en');
    component.jobDetails.set(job);
    const result = component.jobDescriptionForCurrentLang();
    expect(result).toBe('<p>English</p>');
  });

  it('should return German job description when current language is de', () => {
    const job = { jobDescriptionEN: '<p>English</p>', jobDescriptionDE: '<p>Deutsch</p>' } as JobDetails;
    translate.use('de');
    component.jobDetails.set(job);
    const result = component.jobDescriptionForCurrentLang();
    expect(result).toBe('<p>Deutsch</p>');
  });

  it('should fall back to the other language when job description of current language is empty', () => {
    const job = { jobDescriptionEN: '   ', jobDescriptionDE: '<p>Deutsch Fallback</p>' } as JobDetails;
    translate.use('en');
    component.jobDetails.set(job);
    const result = component.jobDescriptionForCurrentLang();
    expect(result).toBe('<p>Deutsch Fallback</p>');
  });

  it('should returns empty string when job is null or undefined', () => {
    component.jobDetails.set(null);
    expect(component.jobDescriptionForCurrentLang()).toBe('');
    (component as any).jobDetails.set(undefined);
    expect(component.jobDescriptionForCurrentLang()).toBe('');
  });

  it('should return null from primaryActionButton when previewData exists', () => {
    const previewSignal = signal({ title: 'Preview job' } as JobFormDTO);
    (component as unknown as { previewData: () => typeof previewSignal }).previewData = () => previewSignal;
    const button = component.primaryActionButton();
    expect(button).toBeNull();
  });

  it('should trigger onApply from computed button', () => {
    const job = { belongsToResearchGroup: false, applicationState: undefined } as unknown as ReturnType<JobDetailComponent['jobDetails']>;
    component.jobDetails.set(job);
    const spy = vi.spyOn(component, 'onApply');
    const btn = component.primaryActionButton();
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
    const btn = component.primaryActionButton();
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
    const btn = component.primaryActionButton();
    btn?.onClick();
    expect(spy).toHaveBeenCalled();
  });

  it('should trigger onEditJob from computed button', () => {
    const spy = vi.spyOn(component, 'onEditJob');
    const job = { belongsToResearchGroup: true, jobState: 'DRAFT' } as JobDetails;
    component.jobDetails.set(job);
    const btn = component.primaryActionButton();
    expect(btn?.label).toBe('button.edit');
    btn?.onClick();
    expect(spy).toHaveBeenCalled();
  });

  it('should handle HttpErrorResponse in init()', async () => {
    const httpError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    jobService.getJobDetails.mockReturnValue(throwError(() => httpError));
    await component.init();
    expect(mockToastService.showError).toHaveBeenCalledWith({
      detail: expect.stringContaining('500'),
    });
  });

  it('should return null when jobDetails is falsy in primaryActionButton()', () => {
    component.jobDetails.set(null);
    const result = component.primaryActionButton();
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

    const user = mockAccountService.loadedUser();

    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof mockAccountService.loadedUser>) => JobDetails;
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
    const result = component.primaryActionButton();
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
      jobDescriptionEN: undefined,
      jobDescriptionDE: undefined,
      workload: undefined,
      contractDuration: undefined,
    } as unknown as JobDetailDTO;

    const user = mockAccountService.loadedUser();
    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof mockAccountService.loadedUser>) => JobDetails;
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
    const accountServiceNoId = createAccountServiceMock();
    accountServiceNoId.user.set({ name: 'Anon' } as User);

    const routeNoJobId = {
      snapshot: { paramMap: new Map([['job_id', null]]) },
    } as unknown as ActivatedRoute;

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [JobDetailComponent],
        providers: [
          { provide: Location, useValue: location },
          { provide: JobResourceApiService, useValue: jobService },
          { provide: ResearchGroupResourceApiService, useValue: researchGroupService },
          { provide: ActivatedRoute, useValue: routeNoJobId },
          provideToastServiceMock(mockToastService),
          provideRouterMock(mockRouter),
          provideAccountServiceMock(accountServiceNoId),
          provideTranslateMock(),
          provideHttpClient(),
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
    expect(component.jobStateText()).toBe('Unknown');

    component.jobDetails.set({ jobState: 'NON_EXISTENT_STATE' } as JobDetails);
    expect(component.jobStateText()).toBe('jobState.unknown');
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

    const user = mockAccountService.loadedUser();

    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof mockAccountService.loadedUser>) => JobDetails;
      }
    ).mapToJobDetails(dto, user);

    expect(result.workload).toBe('15');
    expect(result.contractDuration).toBe('9');
  });

  it('should default supervisingProfessor and researchGroup to empty strings in form mode when user info missing', () => {
    const form: JobFormDTO = {
      title: 'Form Job',
      jobDescriptionEN: 'Some description',
      jobDescriptionDE: 'Some description',
      fieldOfStudies: '',
      supervisingProfessor: '',
      location: 'GARCHING',
      state: 'CLOSED',
    };

    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobFormDTO, u?: ReturnType<typeof mockAccountService.loadedUser>, rg?: unknown, f?: boolean) => JobDetails;
      }
    ).mapToJobDetails(form, undefined, undefined, true);

    expect(result.supervisingProfessor).toBe('');
    expect(result.researchGroup).toBe('');
  });

  it('should call getResourceGroupDetails with empty string when user has no researchGroup', async () => {
    const userWithoutGroup = { id: 'u2', name: 'NoGroupUser', researchGroup: {} };

    mockAccountService.user.set(userWithoutGroup as User);

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

  it('should map jobDetails with belongsToResearchGroup true when user and job share group id', () => {
    const user = {
      id: 'u1',
      name: 'Researcher',
      researchGroup: { researchGroupId: 'rgX', name: 'RGX' },
    };
    mockAccountService.user.set(user as User);

    const dto: JobDetailDTO = {
      title: 'RG Job',
      state: 'PUBLISHED',
      supervisingProfessorName: 'ProfX',
      researchGroup: { name: 'RGX', researchGroupId: 'rgX' },
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    } as JobDetailDTO;

    const result = (
      component as unknown as {
        mapToJobDetails: (d: JobDetailDTO, u?: ReturnType<typeof mockAccountService.loadedUser>) => JobDetails;
      }
    ).mapToJobDetails(dto, user as User);
    expect(result.belongsToResearchGroup).toBe(true);
  });

  describe('PDF Download functionality', () => {
    it('should call onDownloadPDF when pdfButton is clicked', async () => {
      const spy = vi.spyOn(component, 'onDownloadPDF').mockResolvedValue();

      fixture.componentRef.setInput('previewData', undefined);

      component.jobDetails.set({
        jobState: 'PUBLISHED',
        belongsToResearchGroup: false,
      } as any);

      const menuItems = component.menuItems();

      const pdfItem = menuItems.find(item => item.label === 'button.downloadPDF');
      expect(pdfItem).toBeDefined();

      pdfItem!.command?.();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should download PDF for normal job', async () => {
      const mockResponse = {
        headers: { get: vi.fn().mockReturnValue('attachment; filename="test.pdf"') },
        body: new Blob(['pdf content'], { type: 'application/pdf' }),
      };
      pdfExportService.exportJobToPDF.mockReturnValue(of(mockResponse));

      component.jobId.set('job123');
      await component.onDownloadPDF();

      expect(pdfExportService.exportJobToPDF).toHaveBeenCalledWith('job123', expect.any(Object), 'response');
    });

    it('should download PDF for preview job', async () => {
      const mockResponse = {
        headers: { get: vi.fn().mockReturnValue('attachment; filename="preview.pdf"') },
        body: new Blob(['pdf content'], { type: 'application/pdf' }),
      };
      pdfExportService.exportJobPreviewToPDF.mockReturnValue(of(mockResponse));

      const previewJob: JobFormDTO = { title: 'Preview', supervisingProfessor: 'u1' } as JobFormDTO;
      fixture.componentRef.setInput('previewData', signal(previewJob));

      await component.onDownloadPDF();

      expect(pdfExportService.exportJobPreviewToPDF).toHaveBeenCalled();
    });

    it('should show error when preview formData is missing', async () => {
      fixture.componentRef.setInput('previewData', signal(undefined));

      await component.onDownloadPDF();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('pdf.couldNotGeneratePdf');
    });

    it('should handle error in preview PDF generation', async () => {
      pdfExportService.exportJobPreviewToPDF.mockReturnValue(throwError(() => new Error('PDF error')));

      const previewJob: JobFormDTO = { title: 'Preview', supervisingProfessor: 'u1' } as JobFormDTO;
      fixture.componentRef.setInput('previewData', signal(previewJob));

      await component.onDownloadPDF();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('pdf.couldNotGeneratePdf');
    });

    it('should handle error in normal PDF generation', async () => {
      pdfExportService.exportJobToPDF.mockReturnValue(throwError(() => new Error('PDF error')));

      component.jobId.set('job123');
      await component.onDownloadPDF();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('pdf.couldNotGeneratePdf');
    });

    it('should handle missing Content-Disposition header', async () => {
      const mockResponse = {
        headers: { get: vi.fn().mockReturnValue(null) },
        body: new Blob(['pdf content'], { type: 'application/pdf' }),
      };
      pdfExportService.exportJobToPDF.mockReturnValue(of(mockResponse));

      component.jobId.set('job123');
      await component.onDownloadPDF();

      expect(pdfExportService.exportJobToPDF).toHaveBeenCalledOnce();
    });

    it('should use default filename when regex does not match Content-Disposition', async () => {
      const mockResponse = {
        headers: { get: vi.fn().mockReturnValue('attachment; badformat') },
        body: new Blob(['pdf content'], { type: 'application/pdf' }),
      };
      pdfExportService.exportJobToPDF.mockReturnValue(of(mockResponse));

      component.jobId.set('job123');
      await component.onDownloadPDF();

      expect(pdfExportService.exportJobToPDF).toHaveBeenCalledOnce();
    });

    it('should use default filename when regex does not match in preview mode', async () => {
      const mockResponse = {
        headers: { get: vi.fn().mockReturnValue('attachment; badformat') },
        body: new Blob(['pdf content'], { type: 'application/pdf' }),
      };

      pdfExportService.exportJobPreviewToPDF.mockReturnValue(of(mockResponse));

      const previewJob: JobFormDTO = {
        title: 'Preview',
        supervisingProfessor: 'u1',
      } as JobFormDTO;

      fixture.componentRef.setInput('previewData', signal(previewJob));

      await component.onDownloadPDF();

      expect(pdfExportService.exportJobPreviewToPDF).toHaveBeenCalledOnce();
    });
  });
});

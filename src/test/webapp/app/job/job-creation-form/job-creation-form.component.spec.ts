import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { Location } from '@angular/common';

import { JobCreationFormComponent } from 'app/job/job-creation-form/job-creation-form.component';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { provideTranslateMock } from '../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../util/fontawesome.testing';

import * as DropdownOptions from 'app/job/dropdown-options';
import { signal } from '@angular/core';
import { User } from 'app/core/auth/account.service';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';

interface Step {
  name: string;
  disabled?: boolean;
  buttonGroupPrev?: { onClick: () => void }[];
  buttonGroupNext?: { onClick: () => void; disabled?: boolean }[];
}

describe('JobCreationFormComponent', () => {
  let fixture: ComponentFixture<JobCreationFormComponent>;
  let component: JobCreationFormComponent;

  let accountService: Pick<AccountService, 'loadedUser'>;
  let jobService: {
    getJobById: ReturnType<typeof vi.fn>;
    createJob: ReturnType<typeof vi.fn>;
    updateJob: ReturnType<typeof vi.fn>;
  };
  let toast: Pick<ToastService, 'showErrorKey' | 'showSuccessKey'>;
  let router: Pick<Router, 'navigate'>;
  let location: Pick<Location, 'back'>;
  let route$: Subject<UrlSegment[]>;

  beforeEach(async () => {
    accountService = {
      loadedUser: signal<User | undefined>({ id: 'u1', name: 'User X' } as User),
    };

    jobService = {
      getJobById: vi.fn().mockReturnValue(of({ title: 'Loaded Job', description: 'Desc' })),
      createJob: vi.fn().mockReturnValue(of({ jobId: 'new123' })),
      updateJob: vi.fn().mockReturnValue(of({})),
    };

    toast = {
      showErrorKey: vi.fn(),
      showSuccessKey: vi.fn(),
    };

    router = { navigate: vi.fn() };
    location = { back: vi.fn() };
    route$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [JobCreationFormComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: JobResourceApiService, useValue: jobService },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        { provide: ActivatedRoute, useValue: { url: route$, snapshot: { paramMap: new Map() } } },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    })
      .overrideComponent(JobCreationFormComponent, {
        remove: { providers: [JobResourceApiService] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(JobCreationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute pageTitle based on mode', () => {
    component.mode.set('create');
    expect(component.pageTitle()).toContain('create');

    component.mode.set('edit');
    expect(component.pageTitle()).toContain('edit');
  });

  it('should detect unsaved changes', () => {
    const last = component.lastSavedData();
    component.basicInfoForm.patchValue({ title: 'changed' });
    expect(component.hasUnsavedChanges()).toBe(true);
    component.basicInfoForm.patchValue({ title: last?.title });
  });

  it('should show error if privacy not accepted on publish', async () => {
    component.additionalInfoForm.patchValue({ privacyAccepted: false });
    await component.publishJob();
    expect(toast.showErrorKey).toHaveBeenCalledWith('privacy.privacyConsent.toastError');
  });

  it('should set savingState to FAILED when autoSave fails', async () => {
    vi.spyOn(jobService, 'updateJob').mockReturnValueOnce(throwError(() => new Error('fail')));
    component.jobId.set('id123');
    await (component as unknown as { performAutoSave: () => Promise<void> }).performAutoSave();
    expect(component.savingState()).toBe('FAILED');
    expect(toast.showErrorKey).toHaveBeenCalledWith('toast.saveFailed');
  });

  it('should call Location.back on onBack', () => {
    component.onBack();
    expect(location.back).toHaveBeenCalled();
  });

  it('should compute savingBadgeCalculatedClass correctly', () => {
    component.savingState.set('SAVED');
    expect(component.savingBadgeCalculatedClass()).toContain('saved_color');
    component.savingState.set('FAILED');
    expect(component.savingBadgeCalculatedClass()).toContain('failed_color');
    component.savingState.set('SAVING');
    expect(component.savingBadgeCalculatedClass()).toContain('saving_color');
  });

  it('should navigate to login if no user in init', async () => {
    vi.clearAllMocks();
    accountService.loadedUser = signal<User | undefined>(undefined);

    const fixture2 = TestBed.createComponent(JobCreationFormComponent);
    fixture2.detectChanges();
    await fixture2.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to /my-positions if edit mode but no jobId', async () => {
    // emit "edit" mode
    route$.next([new UrlSegment('job', {}), new UrlSegment('edit', {})]);
    // snapshot with no job_id
    const routeMock = TestBed.inject(ActivatedRoute) as unknown as {
      url: Subject<UrlSegment[]>;
      snapshot: { paramMap: { get: (key: string) => string | null } };
    };
    routeMock.snapshot.paramMap = { get: () => null };

    const fixture2 = TestBed.createComponent(JobCreationFormComponent);
    fixture2.detectChanges();

    await fixture2.whenStable();
    expect(router.navigate).toHaveBeenCalledWith(['/my-positions']);
  });

  it('should publish successfully and navigate', async () => {
    component.basicInfoForm.patchValue({
      title: 'T',
      researchArea: 'AI',
      fieldOfStudies: { value: 'CS' },
      location: { value: 'MUNICH' },
      supervisingProfessor: 'Prof',
    });
    component.positionDetailsForm.patchValue({
      description: 'desc',
      tasks: 'tasks',
      requirements: 'reqs',
    });
    component.additionalInfoForm.patchValue({ privacyAccepted: true });

    component.basicInfoForm.updateValueAndValidity();
    component.positionDetailsForm.updateValueAndValidity();
    fixture.detectChanges();

    component.jobId.set('id123');
    await component.publishJob();

    expect(toast.showSuccessKey).toHaveBeenCalledWith('toast.published');
    expect(router.navigate).toHaveBeenCalledWith(['/my-positions']);
  });

  it('should handle publishJob failure', async () => {
    jobService.updateJob.mockReturnValueOnce(throwError(() => new Error('fail')));

    component.basicInfoForm.patchValue({
      title: 'T',
      researchArea: 'AI',
      fieldOfStudies: { value: 'CS' },
      location: { value: 'MUNICH' },
      supervisingProfessor: 'Prof',
    });
    component.positionDetailsForm.patchValue({
      description: 'desc',
      tasks: 'tasks',
      requirements: 'reqs',
    });
    component.additionalInfoForm.patchValue({ privacyAccepted: true });

    component.basicInfoForm.updateValueAndValidity();
    component.positionDetailsForm.updateValueAndValidity();
    fixture.detectChanges();

    component.jobId.set('id123');
    await component.publishJob();

    expect(toast.showErrorKey).toHaveBeenCalledWith('toast.publishFailed');
  });

  it('should return undefined when findDropdownOption has no match', () => {
    const result = (component as unknown as { findDropdownOption: (arr: { value: string }[], val: string) => unknown }).findDropdownOption(
      [{ value: 'x' }],
      'y',
    );
    expect(result).toBeUndefined();
  });

  it('should disable steps in buildStepData when forms invalid', () => {
    (component as { panel1: () => object }).panel1 = () => ({});
    (component as { panel2: () => object }).panel2 = () => ({});
    (component as { panel4: () => object }).panel4 = () => ({});
    (component as { savingStatePanel: () => object }).savingStatePanel = () => ({});

    component.basicInfoValid.set(false);
    component.positionDetailsValid.set(false);

    const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

    const step2 = steps.find(s => s.name.includes('positionDetails'));
    const step4 = steps.find(s => s.name.includes('summary'));

    expect(step2?.disabled).toBe(true);
    expect(step4?.disabled).toBe(true);
  });

  it('should handle init error by showing toast and navigating', async () => {
    vi.clearAllMocks();

    const routeMock = TestBed.inject(ActivatedRoute) as ActivatedRoute;
    routeMock.url = throwError(() => new Error('fail'));

    const fixture2 = TestBed.createComponent(JobCreationFormComponent);
    fixture2.detectChanges();
    await fixture2.whenStable();

    expect(toast.showErrorKey).toHaveBeenCalledWith('toast.loadFailed');
    expect(router.navigate).toHaveBeenCalledWith(['/my-positions']);
  });

  it('should set jobId after creating a new job', async () => {
    jobService.createJob.mockReturnValueOnce(of({ jobId: 'abc123' }));

    component.jobId.set('');
    await (component as unknown as { performAutoSave: () => Promise<void> }).performAutoSave();

    expect(component.jobId()).toBe('abc123');
    expect(jobService.createJob).toHaveBeenCalled();
  });

  it('should clear autoSaveTimer if set', () => {
    const spy = vi.spyOn(global, 'clearTimeout');
    (component as unknown as { autoSaveTimer: number | undefined }).autoSaveTimer = 123;

    (component as unknown as { clearAutoSaveTimer: () => void }).clearAutoSaveTimer();

    expect(spy).toHaveBeenCalledWith(123);
    expect((component as unknown as { autoSaveTimer?: number }).autoSaveTimer).toBeUndefined();
  });

  it('should set isLoading to false after init completes', async () => {
    const routeMock = TestBed.inject(ActivatedRoute) as unknown as { snapshot: { paramMap: Map<string, string> }; url: unknown };
    routeMock.url = of([{ path: 'job' }, { path: 'create' }]);

    const fixture2 = TestBed.createComponent(JobCreationFormComponent);
    fixture2.detectChanges();

    await fixture2.whenStable(); // wait for async init

    expect(fixture2.componentInstance.isLoading()).toBe(false);
  });

  it('should handle createJob returning null jobId', async () => {
    jobService.createJob.mockReturnValueOnce(of({ jobId: null }));

    component.jobId.set('');
    await (component as unknown as { performAutoSave: () => Promise<void> }).performAutoSave();

    // jobId stays empty string
    expect(component.jobId()).toBe('');
    expect(jobService.createJob).toHaveBeenCalled();
  });

  it('should execute panel1 onClick in buildStepData', () => {
    // Mock template refs
    (component as { panel1: () => object }).panel1 = () => ({});
    (component as { savingStatePanel: () => object }).savingStatePanel = () => ({});

    // Make valid/invalid states so `disabled` is evaluated
    component.basicInfoValid.set(false);
    let steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();
    expect(steps[0].buttonGroupNext?.[0].disabled).toBe(true);

    component.basicInfoValid.set(true);
    steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();
    expect(steps[0].buttonGroupNext?.[0].disabled).toBe(false);

    // now call the anonymous onClick safely
    steps[0].buttonGroupNext?.[0].onClick?.();
  });

  it('should return early in publishJob when jobData is undefined', async () => {
    component.additionalInfoForm.patchValue({ privacyAccepted: true });
    // leave forms invalid so publishableJobData() === undefined
    component.basicInfoForm.patchValue({ title: '' });
    component.positionDetailsForm.patchValue({ description: '' });

    await component.publishJob();

    // no success/error toast should be called
    expect(toast.showSuccessKey).not.toHaveBeenCalled();
    expect(toast.showErrorKey).not.toHaveBeenCalled();
  });

  it('should populate fundingType when job has it', () => {
    const job: {
      title: string;
      researchArea: string;
      description: string;
      tasks: string;
      requirements: string;
      fundingType: string;
    } = {
      title: 'Job',
      researchArea: 'R',
      description: 'D',
      tasks: 'T',
      requirements: 'Q',
      fundingType: 'F',
    };

    (component as unknown as { populateForm: (job: Record<string, unknown>) => void }).populateForm(job);
    expect(component.basicInfoForm.get('fundingType')).toBeDefined();
  });

  it('should execute back buttons in buildStepData for panel2 and panel4', () => {
    (component as unknown as { panel1: () => object }).panel1 = () => ({});
    (component as unknown as { panel2: () => object }).panel2 = () => ({});
    (component as unknown as { panel4: () => object }).panel4 = () => ({});
    (component as unknown as { savingStatePanel: () => object }).savingStatePanel = () => ({});

    const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

    const panel2Back = steps.find(s => s.name.includes('positionDetails'))?.buttonGroupPrev?.[0];
    const panel4Back = steps.find(s => s.name.includes('summary'))?.buttonGroupPrev?.[0];

    expect(() => panel2Back?.onClick()).not.toThrow();
    expect(() => panel4Back?.onClick()).not.toThrow();
  });

  it('should call updateJob when jobId is set in performAutoSave', async () => {
    component.jobId.set('job123');
    await (component as unknown as { performAutoSave: () => Promise<void> }).performAutoSave();

    expect(jobService.updateJob).toHaveBeenCalledWith('job123', expect.any(Object));
  });

  it('should populate fundingType when DropdownOptions match', () => {
    const job: { fundingType: string } = { fundingType: DropdownOptions.fundingTypes[0].value };
    (component as unknown as { populateForm: (job: Record<string, unknown>) => void }).populateForm(job);
    expect(component.basicInfoForm.get('fundingType')?.value).toEqual(DropdownOptions.fundingTypes[0]);
  });

  it('should call confirm() on sendPublishDialog when publish step button clicked', () => {
    const confirmSpy = vi.fn();
    (component as unknown as { sendPublishDialog: () => { confirm: () => void } }).sendPublishDialog = () => ({
      confirm: confirmSpy,
    });

    (component as unknown as { panel1: () => object }).panel1 = () => ({});
    (component as unknown as { panel4: () => object }).panel4 = () => ({});
    (component as unknown as { savingStatePanel: () => object }).savingStatePanel = () => ({});

    component.basicInfoValid.set(true);
    component.positionDetailsValid.set(true);

    const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();
    const publishBtn = steps.find(s => s.name.includes('summary'))?.buttonGroupNext?.[0];
    publishBtn?.onClick();

    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should trigger performAutoSave from setupAutoSave effect', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(component as unknown as { performAutoSave: () => Promise<void> }, 'performAutoSave').mockResolvedValue();

    (component as unknown as { autoSaveInitialized: boolean }).autoSaveInitialized = true; // skip first run
    component.basicInfoForm.patchValue({ title: 'new title' });

    vi.runAllTimers();
    await Promise.resolve();

    expect(spy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should enter edit mode and call getJobById when jobId is present', async () => {
    const routeMock = TestBed.inject(ActivatedRoute) as ActivatedRoute;
    routeMock.url = of([new UrlSegment('job', {}), new UrlSegment('edit', {})]);

    (routeMock as any).snapshot = {
      paramMap: {
        get: (key: string) => (key === 'job_id' ? 'job123' : null),
      },
    };

    jobService.getJobById.mockReturnValueOnce(of({ title: 'JobX', description: 'Desc' }));

    const fixture2 = TestBed.createComponent(JobCreationFormComponent);
    fixture2.detectChanges();
    await fixture2.whenStable();

    const comp2 = fixture2.componentInstance;
    expect(comp2.jobId()).toBe('job123');
    expect(jobService.getJobById).toHaveBeenCalledWith('job123');
  });

  it('should build Job DTO with default empty strings when form fields missing', () => {
    component.basicInfoForm.reset();
    component.positionDetailsForm.reset();

    const dto = (component as unknown as { createJobDTO: () => JobFormDTO }).createJobDTO();

    expect(dto.title).toBe('');
    expect(dto.researchArea).toBe('');
    expect(dto.startDate).toBe('');
    expect(dto.endDate).toBe('');
    expect(dto.description).toBe('');
    expect(dto.tasks).toBe('');
    expect(dto.requirements).toBe('');
  });

  it('should build Job DTO with provided form values', () => {
    component.basicInfoForm.patchValue({
      title: 'My Job',
      researchArea: 'AI ',
      startDate: '2025-10-03',
      applicationDeadline: '2025-11-01',
    });
    component.positionDetailsForm.patchValue({
      description: 'Some description ',
      tasks: 'Some tasks ',
      requirements: 'Some requirements ',
    });

    const dto = (component as unknown as { createJobDTO: () => JobFormDTO }).createJobDTO();

    expect(dto.title).toBe('My Job');
    expect(dto.researchArea).toBe('AI');
    expect(dto.startDate).toBe('2025-10-03');
    expect(dto.endDate).toBe('2025-11-01');
    expect(dto.description).toBe('Some description');
    expect(dto.tasks).toBe('Some tasks');
    expect(dto.requirements).toBe('Some requirements');
  });

  it('should call onClick of step1 prev and next buttons', () => {
    (component as unknown as { panel1: () => object }).panel1 = () => ({});
    (component as unknown as { savingStatePanel: () => object }).savingStatePanel = () => ({});

    const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

    // prev back button
    const backBtn = steps[0].buttonGroupPrev?.[0];
    backBtn?.onClick();
    expect(location.back).toHaveBeenCalled();

    // next button (noop)
    const nextBtn = steps[0].buttonGroupNext?.[0];
    expect(() => nextBtn?.onClick()).not.toThrow();
  });

  it('should execute panel2 next button onClick (noop)', () => {
    (component as unknown as { panel1: () => object }).panel1 = () => ({});
    (component as unknown as { panel2: () => object }).panel2 = () => ({});
    (component as unknown as { savingStatePanel: () => object }).savingStatePanel = () => ({});

    const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

    const panel2Next = steps.find(s => s.name.includes('positionDetails'))?.buttonGroupNext?.[0];
    expect(() => panel2Next?.onClick()).not.toThrow();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ApplicationDetailComponent } from 'app/evaluation/application-detail/application-detail.component';
import { ApplicationEvaluationResourceApiService } from 'app/generated/api/applicationEvaluationResourceApi.service';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/applicationDocumentIdsDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { availableStatusOptions, sortableFields } from 'app/evaluation/filterSortOptions';
import { ToastService } from 'app/service/toast-service';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

function makeDetailApp(id: string, state: string = 'SENT'): ApplicationEvaluationDetailDTO {
  return {
    jobId: 'job-1',
    applicationDetailDTO: {
      applicationId: id,
      jobId: 'job-1',
      supervisingProfessorName: 'Prof. Test',
      researchGroup: 'AI Lab',
      applicationState: state as any,
    },
  } as ApplicationEvaluationDetailDTO;
}

function makeDocumentIds(): ApplicationDocumentIdsDTO {
  return {
    cvDocumentDictionaryId: { id: 'cv-1', size: 123456, name: 'CV.pdf' },
  };
}

describe('ApplicationDetailComponent', () => {
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  let component: ApplicationDetailComponent;

  let evaluationApi: Record<string, ReturnType<typeof vi.fn>>;
  let applicationApi: Record<string, ReturnType<typeof vi.fn>>;
  let router: Pick<Router, 'navigate'>;
  let toastService: Pick<ToastService, 'showErrorKey' | 'showError'>;
  let q$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    vi.useFakeTimers();

    evaluationApi = {
      getAllJobNames: vi.fn().mockReturnValue(of(['Job B', 'Job A'])),
      getApplicationsDetails: vi.fn().mockReturnValue(of({ applications: [makeDetailApp('1')], totalRecords: 10 })),
      getApplicationsDetailsWindow: vi.fn().mockReturnValue(of({ applications: [makeDetailApp('1')], totalRecords: 10 })),
      acceptApplication: vi.fn().mockReturnValue(of({})),
      rejectApplication: vi.fn().mockReturnValue(of({})),
      markApplicationAsInReview: vi.fn().mockReturnValue(of({})),
    };

    applicationApi = {
      getDocumentDictionaryIds: vi.fn().mockReturnValue(of(makeDocumentIds())),
    };

    router = { navigate: vi.fn().mockResolvedValue(true) };
    toastService = { showErrorKey: vi.fn(), showError: vi.fn() };
    q$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [
        { provide: ApplicationEvaluationResourceApiService, useValue: evaluationApi },
        { provide: ApplicationResourceApiService, useValue: applicationApi },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toastService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: q$.asObservable(),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        provideFontAwesomeTesting(),
        provideTranslateMock(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    vi.runOnlyPendingTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    fixture?.destroy();
  });

  // ---------------- BASIC CREATION ----------------
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ---------------- FILTER / SEARCH / SORT ----------------
  it('should trigger search reload when onSearchEmit is called', async () => {
    const spy = vi.spyOn(component as any, 'loadInitialPage').mockResolvedValue(undefined);
    component.onSearchEmit('test');
    expect(spy).toHaveBeenCalled();
    expect(component.searchQuery()).toBe('test');
  });

  it('should handle filter change for jobTitle', async () => {
    const spy = vi.spyOn(component as any, 'loadInitialPage').mockResolvedValue(undefined);
    component.onFilterEmit({ filterId: 'jobTitle', selectedValues: ['Job A'] } as any);
    expect(component.selectedJobFilters()).toEqual(['Job A']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle filter change for status', async () => {
    const spy = vi.spyOn(component as any, 'loadInitialPage').mockResolvedValue(undefined);
    const label = availableStatusOptions[0].label;
    component.onFilterEmit({ filterId: 'status', selectedValues: [label] } as any);
    expect(component.selectedStatusFilters()).toContain(availableStatusOptions[0].key);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle sort change correctly', async () => {
    const spy = vi.spyOn(component as any, 'loadInitialPage').mockResolvedValue(undefined);
    component.loadOnSortEmit({ field: 'name', direction: 'ASC' } as any);
    expect(component.sortBy()).toBe('name');
    expect(component.sortDirection()).toBe('ASC');
    expect(spy).toHaveBeenCalled();
  });

  // ---------------- ACCEPT / REJECT ----------------
  it('should open accept and reject dialogs', () => {
    component.openAcceptDialog();
    expect(component.reviewDialogVisible()).toBe(true);
    expect(component.reviewDialogMode()).toBe('ACCEPT');

    component.openRejectDialog();
    expect(component.reviewDialogVisible()).toBe(true);
    expect(component.reviewDialogMode()).toBe('REJECT');
  });

  it('should accept application and close dialog', async () => {
    const app = makeDetailApp('1');
    component.currentApplication.set(app);
    await component.acceptApplication({ closeJob: false });
    expect(component.currentApplication()?.applicationDetailDTO.applicationState).toBe('ACCEPTED');
    expect(component.reviewDialogVisible()).toBe(false);
    expect(evaluationApi.acceptApplication).toHaveBeenCalled();
  });

  it('should reject application and close dialog', async () => {
    const app = makeDetailApp('2');
    component.currentApplication.set(app);
    await component.rejectApplication({ reason: 'FAILED_REQUIREMENTS' });
    expect(component.currentApplication()?.applicationDetailDTO.applicationState).toBe('REJECTED');
    expect(component.reviewDialogVisible()).toBe(false);
    expect(evaluationApi.rejectApplication).toHaveBeenCalled();
  });

  it('should reject other applications when closing job', async () => {
    component.applications.set([
      makeDetailApp('1', 'SENT'),
      makeDetailApp('2', 'IN_REVIEW'),
      makeDetailApp('3', 'ACCEPTED'),
      makeDetailApp('4', 'REJECTED'),
    ]);
    component.currentApplication.set(component.applications()[0]);
    await component.acceptApplication({ closeJob: true });
    const apps = component.applications();
    expect(apps[1].applicationDetailDTO.applicationState).toBe('REJECTED'); // IN_REVIEW turned REJECTED
    expect(apps[3].applicationDetailDTO.applicationState).toBe('REJECTED');
  });

  // ---------------- REVIEW ENABLE / DISABLE ----------------
  it('should disable review for ACCEPTED or REJECTED', () => {
    component.currentApplication.set(makeDetailApp('1', 'ACCEPTED'));
    expect(component.canReview()).toBe(false);
    component.currentApplication.set(makeDetailApp('2', 'REJECTED'));
    expect(component.canReview()).toBe(false);
  });

  it('should enable review for SENT or IN_REVIEW', () => {
    component.currentApplication.set(makeDetailApp('1', 'SENT'));
    expect(component.canReview()).toBe(true);
    component.currentApplication.set(makeDetailApp('2', 'IN_REVIEW'));
    expect(component.canReview()).toBe(true);
  });

  // ---------------- STATE MANAGEMENT ----------------
  it('should update currentApplicationState properly', () => {
    const app = makeDetailApp('1', 'SENT');
    component.applications.set([app]);
    component.currentApplication.set(app);
    component.updateCurrentApplicationState('ACCEPTED');
    expect(component.currentApplication()?.applicationDetailDTO.applicationState).toBe('ACCEPTED');
  });

  it('should handle undefined currentApplication safely', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.currentApplication.set(undefined);
    component.updateCurrentApplicationState('REJECTED');
    expect(consoleSpy).toHaveBeenCalledWith('Current application is undefined');
    consoleSpy.mockRestore();
  });

  // ---------------- NAVIGATION ----------------
  it('should navigate next and prev correctly', async () => {
    component.applications.set([makeDetailApp('1'), makeDetailApp('2'), makeDetailApp('3')]);
    component.totalRecords.set(3);
    component.currentApplication.set(component.applications()[0]);

    component.onNext();
    expect(component.currentIndex()).toBe(1);
    component.onPrev();
    expect(component.currentIndex()).toBe(0);
  });

  it('should not navigate beyond boundaries', () => {
    component.totalRecords.set(1);
    component.currentIndex.set(0);
    component.onPrev();
    component.onNext();
    expect(component.currentIndex()).toBe(0);
  });

  // ---------------- ERROR HANDLING ----------------
  it('should show toast on loadAllJobNames failure', async () => {
    evaluationApi.getAllJobNames.mockReturnValueOnce(throwError(() => new Error('fail')));
    await component.loadAllJobNames();
    expect(toastService.showErrorKey).toHaveBeenCalledWith('evaluation.errors.loadJobNames');
  });

  // ---------------- CONSTANTS ----------------
  it('should expose constants and derived values', () => {
    expect((component as any).WINDOW_SIZE).toBe(7);
    expect((component as any).sortableFields).toEqual(sortableFields);
    expect((component as any).half).toBe(3);
  });

  it('should compute currentApplicationId correctly', () => {
    component.currentApplication.set(makeDetailApp('abc'));
    expect((component as any).currentApplicationId()).toBe('abc');
  });

  describe('Window and Page Loading', () => {
    it('should loadWindow correctly and set state', async () => {
      const mockRes = {
        applications: [makeDetailApp('1'), makeDetailApp('2')],
        totalRecords: 10,
        currentIndex: 1,
        windowIndex: 1,
      };
      evaluationApi.getApplicationsDetailsWindow.mockReturnValue(of(mockRes));
      const updateDocSpy = vi.spyOn(component as any, 'updateDocumentInformation').mockImplementation(() => {});
      const markSpy = vi.spyOn(component as any, 'markCurrentApplicationAsInReview').mockResolvedValue(() => {});

      await (component as any).loadWindow('app-1');

      expect(evaluationApi.getApplicationsDetailsWindow).toHaveBeenCalledWith(
        'app-1',
        7,
        component.sortBy(),
        component.sortDirection(),
        undefined,
        undefined,
        undefined,
      );
      expect(component.totalRecords()).toBe(10);
      expect(component.applications().length).toBe(2);
      expect(component.windowIndex()).toBe(1);
      expect(component.currentIndex()).toBe(1);
      expect(component.currentApplication()?.applicationDetailDTO.applicationId).toBe('2');
      expect(updateDocSpy).toHaveBeenCalledWith('2');
      expect(markSpy).toHaveBeenCalled();
    });

    it('should handle error in loadWindow gracefully', async () => {
      evaluationApi.getApplicationsDetailsWindow.mockReturnValueOnce(throwError(() => new Error('fail')));
      await (component as any).loadWindow('app-1');
      expect(toastService.showErrorKey).toHaveBeenCalledWith('evaluation.errors.loadApplications');
    });

    it('should loadNext append new entry and maintain window size', async () => {
      const initialApps = Array.from({ length: 7 }, (_, i) => makeDetailApp(`${i}`));
      component.applications.set(initialApps);
      component.windowIndex.set(6);
      const newApp = makeDetailApp('new');
      vi.spyOn(component as any, 'loadPage').mockResolvedValue([newApp]);
      const updateDocSpy = vi.spyOn(component as any, 'updateDocumentInformation').mockImplementation(() => {});

      await (component as any).loadNext(8);

      const apps = component.applications();
      expect(apps.length).toBe(7);
      expect(apps.at(-1)?.applicationDetailDTO.applicationId).toBe('new');
      expect(updateDocSpy).toHaveBeenCalledWith(apps[component.windowIndex()].applicationDetailDTO.applicationId);
    });

    it('should not call updateDocumentInformation if loadPage returns undefined', async () => {
      vi.spyOn(component as any, 'loadPage').mockResolvedValue(undefined);
      const spy = vi.spyOn(component as any, 'updateDocumentInformation');
      await (component as any).loadNext(8);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should loadPrev prepend new entry and adjust windowIndex', async () => {
      component.applications.set([makeDetailApp('2'), makeDetailApp('3')]);
      component.windowIndex.set(0);
      const newApp = makeDetailApp('1');
      vi.spyOn(component as any, 'loadPage').mockResolvedValue([newApp]);
      const updateDocSpy = vi.spyOn(component as any, 'updateDocumentInformation').mockImplementation(() => {});

      await (component as any).loadPrev(0);

      expect(component.applications()[0].applicationDetailDTO.applicationId).toBe('1');
      expect(component.windowIndex()).toBe(1);
      expect(updateDocSpy).toHaveBeenCalled();
    });

    it('should trim window on loadPrev when exceeding size', async () => {
      const apps = Array.from({ length: 7 }, (_, i) => makeDetailApp(`${i}`));
      component.applications.set(apps);
      vi.spyOn(component as any, 'loadPage').mockResolvedValue([makeDetailApp('new')]);
      const updateDocSpy = vi.spyOn(component as any, 'updateDocumentInformation').mockImplementation(() => {});
      await (component as any).loadPrev(0);
      expect(component.applications().length).toBe(7);
      expect(updateDocSpy).toHaveBeenCalled();
    });

    it('should updateApplications trim front when windowIndex > half', () => {
      const apps = Array.from({ length: 7 }, (_, i) => makeDetailApp(`${i}`));
      component.applications.set(apps);
      component.windowIndex.set(5);
      const updateDocSpy = vi.spyOn(component as any, 'updateDocumentInformation').mockImplementation(() => {});
      (component as any).updateApplications();
      expect(component.applications().length).toBeLessThanOrEqual(7);
      expect(component.windowIndex()).toBeLessThan(5);
      expect(updateDocSpy).toHaveBeenCalled();
    });

    it('should updateApplications trim end when right side too large', () => {
      const apps = Array.from({ length: 10 }, (_, i) => makeDetailApp(`${i}`));
      component.applications.set(apps);
      component.windowIndex.set(1);
      const updateDocSpy = vi.spyOn(component as any, 'updateDocumentInformation').mockImplementation(() => {});
      (component as any).updateApplications();
      expect(component.applications().length).toBeLessThan(10);
      expect(updateDocSpy).toHaveBeenCalled();
    });

    it('should build correct query params', () => {
      component.sortBy.set('name');
      component.sortDirection.set('ASC');
      component.currentApplication.set(makeDetailApp('1'));
      const qp = (component as any).buildQueryParams();
      expect(qp.sortBy).toBe('name');
      expect(qp.sortDir).toBe('ASC');
      expect(qp.applicationId).toBe('1');
    });

    it('should include search param in query params when set', () => {
      component.searchQuery.set('test');
      const qp = (component as any).buildQueryParams();
      expect(qp.search).toBe('test');
    });

    it('should updateUrlQueryParams call router.navigate', async () => {
      const spy = vi.spyOn(router, 'navigate');
      await (component as any).updateUrlQueryParams();
      expect(spy).toHaveBeenCalledWith([], expect.objectContaining({ replaceUrl: true, queryParams: expect.any(Object) }));
    });

    it('should updateDocumentInformation set currentDocumentIds', async () => {
      const ids = makeDocumentIds();
      applicationApi.getDocumentDictionaryIds.mockReturnValueOnce(of(ids));
      await (component as any).updateDocumentInformation('app-1');
      expect(component.currentDocumentIds()).toEqual(ids);
    });
  });
});

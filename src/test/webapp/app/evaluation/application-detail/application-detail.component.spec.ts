import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { ApplicationDetailComponent } from 'app/evaluation/application-detail/application-detail.component';
import { ApplicationEvaluationResourceApiService } from 'app/generated/api/applicationEvaluationResourceApi.service';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/applicationDocumentIdsDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { availableStatusOptions, sortableFields } from 'app/evaluation/filterSortOptions';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideToastServiceMock, ToastServiceMock } from '../../../util/toast-service.mock';
import { provideRouterMock } from '../../../util/router.mock';
import { ToastService } from 'app/service/toast-service';
import { createActivatedRouteMock, provideActivatedRouteMock } from '../../../util/activated-route.mock';

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
  let router: Router;
  let toastService: ToastServiceMock;
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

    const mockActivatedRoute = createActivatedRouteMock({}, {});
    q$ = mockActivatedRoute.queryParamMapSubject;

    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [
        provideRouterMock(),
        { provide: ApplicationEvaluationResourceApiService, useValue: evaluationApi },
        { provide: ApplicationResourceApiService, useValue: applicationApi },
        provideActivatedRouteMock(mockActivatedRoute),
        provideFontAwesomeTesting(),
        provideTranslateMock(),
        provideToastServiceMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService) as ToastServiceMock;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    vi.runOnlyPendingTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    fixture?.destroy();
  });

  // ---------------- FILTER / SEARCH / SORT ----------------
  describe('Filter / Search / Sort', () => {
    it.each([
      {
        name: 'search change',
        call: () => component.onSearchEmit('test'),
        assert: () => expect(component.searchQuery()).toBe('test'),
      },
      {
        name: 'job filter change',
        call: () =>
          component.onFilterEmit({
            filterId: 'jobTitle',
            selectedValues: ['Job A'],
          } as any),
        assert: () => expect(component.selectedJobFilters()).toEqual(['Job A']),
      },
      {
        name: 'status filter change',
        call: () => {
          const label = availableStatusOptions[0].label;
          component.onFilterEmit({ filterId: 'status', selectedValues: [label] } as any);
        },
        assert: () => expect(component.selectedStatusFilters()).toContain(availableStatusOptions[0].key),
      },
    ])('should trigger loadInitialPage on $name', async ({ call, assert }) => {
      const spy = vi
        .spyOn(component as unknown as { loadInitialPage: () => Promise<void> }, 'loadInitialPage')
        .mockResolvedValue(undefined);

      call();
      assert();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle sort change correctly', async () => {
      const spy = vi
        .spyOn(component as unknown as { loadInitialPage: () => Promise<void> }, 'loadInitialPage')
        .mockResolvedValue(undefined);

      component.loadOnSortEmit({ field: 'name', direction: 'ASC' } as any);
      expect(component.sortBy()).toBe('name');
      expect(component.sortDirection()).toBe('ASC');
      expect(spy).toHaveBeenCalled();
    });

    it('should reset isSortInitiatedByUser flag after query param effect when sort was user-initiated', async () => {
      fixture.destroy();

      q$.next(convertToParamMap({ sortBy: 'initialField', sortDir: 'DESC' }));

      fixture = TestBed.createComponent(ApplicationDetailComponent);
      component = fixture.componentInstance;

      const spy = vi
        .spyOn(component as unknown as { loadInitialPage: () => Promise<void> }, 'loadInitialPage')
        .mockResolvedValue(undefined);

      fixture.detectChanges();
      await fixture.whenStable();
      vi.runOnlyPendingTimers();

      (component as unknown as { isSortInitiatedByUser: boolean }).isSortInitiatedByUser = true;
      component.sortBy.set('customField');

      expect((component as unknown as { isSortInitiatedByUser: boolean }).isSortInitiatedByUser).toBe(true);
      expect(component.sortBy()).toBe('customField');

      q$.next(convertToParamMap({ sortBy: 'ignoredField', sortDir: 'ASC' }));
      fixture.detectChanges();
      await fixture.whenStable();
      vi.runOnlyPendingTimers();

      expect(component.sortBy()).toBe('customField');
      expect(component.sortDirection()).toBe('ASC');
      expect((component as unknown as { isSortInitiatedByUser: boolean }).isSortInitiatedByUser).toBe(false);

      expect(spy).toHaveBeenCalled();
    });
  });

  // ---------------- ACCEPT / REJECT ----------------
  describe('Accept / Reject Applications', () => {
    it.each([
      {
        name: 'accept application and close dialog',
        seed: () => component.currentApplication.set(makeDetailApp('1')),
        act: () => component.acceptApplication({ closeJob: false }),
        expectState: 'ACCEPTED',
        apiSpy: () => evaluationApi.acceptApplication,
      },
      {
        name: 'reject application and close dialog',
        seed: () => component.currentApplication.set(makeDetailApp('2')),
        act: () => component.rejectApplication({ reason: 'FAILED_REQUIREMENTS' }),
        expectState: 'REJECTED',
        apiSpy: () => evaluationApi.rejectApplication,
      },
    ])('should $name', async ({ seed, act, expectState, apiSpy }: any) => {
      seed();
      await act();
      expect(component.currentApplication()?.applicationDetailDTO.applicationState).toBe(expectState);
      expect(component.reviewDialogVisible()).toBe(false);
      expect(apiSpy()).toHaveBeenCalled();
    });

    it('should open accept and reject dialogs', () => {
      component.openAcceptDialog();
      expect(component.reviewDialogVisible()).toBe(true);
      expect(component.reviewDialogMode()).toBe('ACCEPT');
      component.openRejectDialog();
      expect(component.reviewDialogVisible()).toBe(true);
      expect(component.reviewDialogMode()).toBe('REJECT');
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
      expect(apps[1].applicationDetailDTO.applicationState).toBe('REJECTED');
      expect(apps[3].applicationDetailDTO.applicationState).toBe('REJECTED');
    });
  });

  // ---------------- REVIEW ENABLE / DISABLE ----------------
  describe('Review Enable / Disable', () => {
    it.each([
      ['ACCEPTED', false],
      ['REJECTED', false],
      ['SENT', true],
      ['IN_REVIEW', true],
    ])('canReview for %s', (state, expected) => {
      component.currentApplication.set(makeDetailApp('x', state as any));
      expect(component.canReview()).toBe(expected);
    });
  });

  // ---------------- STATE MANAGEMENT ----------------
  describe('State Management', () => {
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
  });

  // ---------------- NAVIGATION ----------------
  describe('Navigation', () => {
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

    it('should call loadNext when currentIndex + half < totalRecords', () => {
      const spy = vi
        .spyOn(
          component as unknown as {
            loadNext: (index: number) => Promise<void>;
          },
          'loadNext',
        )
        .mockResolvedValue(undefined);

      component.applications.set([makeDetailApp('1'), makeDetailApp('2'), makeDetailApp('3')]);
      component.totalRecords.set(10);
      component.currentIndex.set(0);
      component.carouselIndex.set(0);
      component.currentApplication.set(component.applications()[0]);
      component.onNext();
      expect(spy).toHaveBeenCalledWith(component.currentIndex() + component.half);
    });

    it('should call loadPrev when currentIndex - half >= 0', () => {
      const spy = vi
        .spyOn(
          component as unknown as {
            loadPrev: (index: number) => Promise<void>;
          },
          'loadPrev',
        )
        .mockResolvedValue(undefined);

      component.applications.set([
        makeDetailApp('0'),
        makeDetailApp('1'),
        makeDetailApp('2'),
        makeDetailApp('3'),
        makeDetailApp('4'),
        makeDetailApp('5'),
        makeDetailApp('6'),
      ]);
      component.totalRecords.set(7);
      component.currentIndex.set(4);
      component.carouselIndex.set(4);
      component.currentApplication.set(component.applications()[4]);
      component.onPrev();
      expect(spy).toHaveBeenCalledWith(component.currentIndex() - component.half);
    });
  });

  // ---------------- ERROR HANDLING ----------------
  describe('Error Handling', () => {
    it('should show toast on loadAllJobNames failure', async () => {
      evaluationApi.getAllJobNames.mockReturnValueOnce(throwError(() => new Error('fail')));
      await component.loadAllJobNames();
      expect(toastService.showErrorKey).toHaveBeenCalledWith('evaluation.errors.loadJobNames');
    });

    it('should show toast error when loadPage throws', async () => {
      evaluationApi.getApplicationsDetails.mockReturnValueOnce(throwError(() => new Error('fail')));

      const result = await (
        component as unknown as {
          loadPage: (page: number, size: number) => Promise<unknown>;
        }
      ).loadPage(0, 1);

      expect(result).toBeUndefined();
      expect(toastService.showErrorKey).toHaveBeenCalledWith('evaluation.errors.loadApplications');
    });
  });

  // ---------------- CONSTANTS ----------------
  describe('Constants', () => {
    it('should expose constants and derived values', () => {
      const testComp = component as unknown as {
        CAROUSEL_SIZE: number;
        sortableFields: typeof sortableFields;
        half: number;
      };

      expect(testComp.CAROUSEL_SIZE).toBe(7);
      expect(testComp.sortableFields).toEqual(sortableFields);
      expect(testComp.half).toBe(3);
    });

    it('should compute currentApplicationId correctly', () => {
      component.currentApplication.set(makeDetailApp('abc'));
      const testComp = component as unknown as {
        currentApplicationId: () => string;
      };
      expect(testComp.currentApplicationId()).toBe('abc');
    });
  });

  // ---------------- WINDOW AND PAGE LOADING ----------------
  describe('Window and Page Loading', () => {
    it('should loadCarousel correctly and set state', async () => {
      const mockRes = {
        applications: [makeDetailApp('1'), makeDetailApp('2')],
        totalRecords: 10,
        currentIndex: 1,
        windowIndex: 1,
      };
      evaluationApi.getApplicationsDetailsWindow.mockReturnValue(of(mockRes));

      const testComp = component as unknown as {
        updateDocumentInformation: (appId: string) => void;
        markCurrentApplicationAsInReview: () => Promise<void>;
        loadCarousel: (appId: string) => Promise<void>;
      };

      const updateDocSpy = vi.spyOn(testComp, 'updateDocumentInformation').mockImplementation(() => {});
      const markSpy = vi.spyOn(testComp, 'markCurrentApplicationAsInReview').mockResolvedValue();

      await testComp.loadCarousel('app-1');

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
      expect(component.carouselIndex()).toBe(1);
      expect(component.currentIndex()).toBe(1);
      expect(component.currentApplication()?.applicationDetailDTO.applicationId).toBe('2');
      expect(updateDocSpy).toHaveBeenCalledWith('2');
      expect(markSpy).toHaveBeenCalled();
    });

    it('should handle error in loadCarousel gracefully', async () => {
      evaluationApi.getApplicationsDetailsWindow.mockReturnValueOnce(throwError(() => new Error('fail')));

      const testComp = component as unknown as {
        loadCarousel: (appId: string) => Promise<void>;
      };

      await testComp.loadCarousel('app-1');

      expect(toastService.showErrorKey).toHaveBeenCalledWith('evaluation.errors.loadApplications');
    });

    it.each([
      {
        op: 'next' as const,
        method: 'loadNext',
        pageResult: [makeDetailApp('new')],
        expectTrim: true,
        expectUpdate: true,
      },
      {
        op: 'next' as const,
        method: 'loadNext',
        pageResult: undefined,
        expectTrim: false,
        expectUpdate: false,
      },
      {
        op: 'prev' as const,
        method: 'loadPrev',
        pageResult: [makeDetailApp('1')],
        expectTrim: false,
        expectUpdate: true,
      },
    ])('should handle $method window maintenance', async ({ op, method, pageResult, expectUpdate }) => {
      const testComp = component as unknown as {
        updateDocumentInformation: (id: string) => void;
        loadPage: (page: number, size: number) => Promise<ReturnType<typeof makeDetailApp>[] | undefined>;
        loadNext: (index: number) => Promise<void>;
        loadPrev: (index: number) => Promise<void>;
      };

      const updateDocSpy = vi.spyOn(testComp, 'updateDocumentInformation').mockImplementation(() => {});

      if (op === 'next') {
        const initialApps = Array.from({ length: 7 }, (_, i) => makeDetailApp(`${i}`));
        component.applications.set(initialApps);
        component.carouselIndex.set(6);

        vi.spyOn(testComp, 'loadPage').mockResolvedValue(pageResult);

        await testComp.loadNext(8);

        if (pageResult) {
          const apps = component.applications();
          expect(apps.length).toBe(7);
          expect(updateDocSpy).toHaveBeenCalledWith(apps[component.carouselIndex()].applicationDetailDTO.applicationId);
        } else {
          expect(updateDocSpy).not.toHaveBeenCalled();
        }
      } else {
        component.applications.set([makeDetailApp('2'), makeDetailApp('3')]);
        component.carouselIndex.set(0);

        vi.spyOn(testComp, 'loadPage').mockResolvedValue(pageResult);

        await testComp.loadPrev(0);

        if (expectUpdate) expect(updateDocSpy).toHaveBeenCalled();
      }
    });

    it('should trim window on loadPrev when exceeding size', async () => {
      const apps = Array.from({ length: 7 }, (_, i) => makeDetailApp(`${i}`));
      component.applications.set(apps);

      const testComp = component as unknown as {
        loadPage: (page: number, size: number) => Promise<ReturnType<typeof makeDetailApp>[]>;
        updateDocumentInformation: (id: string) => void;
        loadPrev: (index: number) => Promise<void>;
      };

      vi.spyOn(testComp, 'loadPage').mockResolvedValue([makeDetailApp('new')]);
      const updateDocSpy = vi.spyOn(testComp, 'updateDocumentInformation').mockImplementation(() => {});

      await testComp.loadPrev(0);

      expect(component.applications().length).toBe(7);
      expect(updateDocSpy).toHaveBeenCalled();
    });

    it('should updateApplications trim front when windowIndex > half', () => {
      const apps = Array.from({ length: 7 }, (_, i) => makeDetailApp(`${i}`));
      component.applications.set(apps);
      component.carouselIndex.set(5);

      const testComp = component as unknown as {
        updateApplications: () => void;
        updateDocumentInformation: (id: string) => void;
      };

      const updateDocSpy = vi.spyOn(testComp, 'updateDocumentInformation').mockImplementation(() => {});

      testComp.updateApplications();

      expect(component.applications().length).toBeLessThanOrEqual(7);
      expect(component.carouselIndex()).toBeLessThan(5);
      expect(updateDocSpy).toHaveBeenCalled();
    });

    it('should updateApplications trim end when right side too large', () => {
      const apps = Array.from({ length: 10 }, (_, i) => makeDetailApp(`${i}`));
      component.applications.set(apps);
      component.carouselIndex.set(1);

      const testComp = component as unknown as {
        updateApplications: () => void;
        updateDocumentInformation: (id: string) => void;
      };

      const updateDocSpy = vi.spyOn(testComp, 'updateDocumentInformation').mockImplementation(() => {});

      testComp.updateApplications();

      expect(component.applications().length).toBeLessThan(10);
      expect(updateDocSpy).toHaveBeenCalled();
    });

    it('should build query params with and without search', () => {
      component.sortBy.set('name');
      component.sortDirection.set('ASC');
      component.currentApplication.set(makeDetailApp('1'));

      const testComp = component as unknown as {
        buildQueryParams: () => {
          sortBy: string;
          sortDir: string;
          applicationId?: string;
          search?: string;
        };
      };

      let qp = testComp.buildQueryParams();
      expect(qp.sortBy).toBe('name');
      expect(qp.sortDir).toBe('ASC');
      expect(qp.applicationId).toBe('1');
      component.searchQuery.set('test');
      qp = testComp.buildQueryParams();
      expect(qp.search).toBe('test');
    });

    it('should updateUrlQueryParams call router.navigate', async () => {
      const spy = vi.spyOn(router, 'navigate');

      const testComp = component as unknown as {
        updateUrlQueryParams: () => Promise<void>;
      };

      await testComp.updateUrlQueryParams();

      expect(spy).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          replaceUrl: true,
          queryParams: expect.any(Object),
        }),
      );
    });

    it('should updateDocumentInformation set currentDocumentIds', async () => {
      const ids = makeDocumentIds();
      applicationApi.getDocumentDictionaryIds.mockReturnValueOnce(of(ids));

      const testComp = component as unknown as {
        updateDocumentInformation: (appId: string) => Promise<void>;
      };

      await testComp.updateDocumentInformation('app-1');

      expect(component.currentDocumentIds()).toEqual(ids);
    });
  });

  // ---------------- INIT ----------------
  describe('Initialization from Query Params', () => {
    it.each([
      {
        qp: { sortDir: 'INVALID' },
        pre: {},
        expect: (c: ApplicationDetailComponent, s: any, w: any) => {
          expect(c.sortDirection()).toBe('DESC');
          expect(s).toHaveBeenCalled();
          expect(w).not.toHaveBeenCalled();
        },
      },
      {
        qp: { sortBy: 'otherField', sortDir: 'ASC' },
        pre: { sortBy: 'manualField', isSortInitiatedByUser: true },
        expect: (c: ApplicationDetailComponent, s: any) => {
          expect(c.sortBy()).toBe('manualField');
          expect(s).toHaveBeenCalled();
        },
      },
      {
        qp: { search: 'fromQuery' },
        pre: { search: 'manualSearch', isSearchInitiatedByUser: true },
        expect: (c: ApplicationDetailComponent, s: any) => {
          expect(c.searchQuery()).toBe('manualSearch');
          expect(s).toHaveBeenCalled();
        },
      },
      {
        qp: { applicationId: 'app-123' },
        pre: {},
        expect: (_: ApplicationDetailComponent, s: any, w: any) => {
          expect(w).toHaveBeenCalledWith('app-123');
          expect(s).not.toHaveBeenCalled();
        },
      },
    ])('should initialize from query params', async ({ qp, pre, expect: assertFn }) => {
      const testComp = component as unknown as {
        loadInitialPage: () => Promise<void>;
        loadCarousel: (id: string) => Promise<void>;
        isSortInitiatedByUser: boolean;
        isSearchInitiatedByUser: boolean;
      };

      const spyInit = vi.spyOn(testComp, 'loadInitialPage').mockResolvedValue(undefined);
      const spyWindow = vi.spyOn(testComp, 'loadCarousel').mockResolvedValue(undefined);

      if (pre.sortBy) component.sortBy.set(pre.sortBy);
      if (pre.search) component.searchQuery.set(pre.search);
      testComp.isSortInitiatedByUser = !!pre.isSortInitiatedByUser;
      testComp.isSearchInitiatedByUser = !!pre.isSearchInitiatedByUser;

      q$.next(convertToParamMap(qp));
      await component.init();
      assertFn(component, spyInit, spyWindow);
    });
  });

  // ---------------- MISC ----------------
  describe('Miscellaneous', () => {
    it('should call rejectOtherApplicationsOfJob with empty string when jobId is undefined', async () => {
      const testComp = component as unknown as {
        rejectOtherApplicationsOfJob: (jobId: string) => Promise<void>;
      };

      const spyRejectOthers = vi.spyOn(testComp, 'rejectOtherApplicationsOfJob');

      const base = makeDetailApp('1', 'SENT');
      const app = {
        ...base,
        jobId: undefined,
        applicationDetailDTO: { ...base.applicationDetailDTO, jobId: undefined },
      } as unknown as ApplicationEvaluationDetailDTO;

      component.currentApplication.set(app);
      component.applications.set([app, makeDetailApp('2', 'SENT')]);
      await component.acceptApplication({ closeJob: true });
      expect(spyRejectOthers).toHaveBeenCalledWith('');
      expect(component.currentApplication()?.applicationDetailDTO.applicationState).toBe('ACCEPTED');
    });

    it('should map translation keys to enum values, falling back when key not found', () => {
      const knownLabel = availableStatusOptions[0].label;
      const knownKey = availableStatusOptions[0].key;

      const testComp = component as unknown as {
        mapTranslationKeysToEnumValues: (labels: string[]) => string[];
      };

      let result = testComp.mapTranslationKeysToEnumValues([knownLabel]);
      expect(result).toEqual([knownKey]);

      result = testComp.mapTranslationKeysToEnumValues(['UNKNOWN_LABEL']);
      expect(result).toEqual(['UNKNOWN_LABEL']);
    });
  });

  // ---------------- LOAD PAGE ----------------
  describe('Load Page', () => {
    it('should load applications with filters and search set', async () => {
      const mockRes = { applications: [makeDetailApp('1')], totalRecords: 5 };
      evaluationApi.getApplicationsDetails.mockReturnValueOnce(of(mockRes));
      component.selectedStatusFilters.set(['SENT']);
      component.selectedJobFilters.set(['AI Lab']);
      component.searchQuery.set('test-search');

      const testComp = component as unknown as {
        loadPage: (page: number, size: number) => Promise<ReturnType<typeof makeDetailApp>[]>;
      };

      const result = await testComp.loadPage(0, 10);

      expect(result).toEqual(mockRes.applications);
      expect(component.totalRecords()).toBe(5);
      expect(evaluationApi.getApplicationsDetails).toHaveBeenLastCalledWith(
        0,
        10,
        component.sortBy(),
        component.sortDirection(),
        ['SENT'],
        ['AI Lab'],
        'test-search',
      );
    });

    it('should handle undefined totalRecords and applications gracefully', async () => {
      const mockRes = { applications: undefined, totalRecords: undefined };
      evaluationApi.getApplicationsDetails.mockReturnValueOnce(of(mockRes));
      component.selectedStatusFilters.set([]);
      component.selectedJobFilters.set([]);
      component.searchQuery.set('');

      const testComp = component as unknown as {
        loadPage: (page: number, size: number) => Promise<ReturnType<typeof makeDetailApp>[] | undefined>;
      };

      const result = await testComp.loadPage(5, 5);

      expect(result).toBeUndefined();
      expect(component.totalRecords()).toBe(0);
      expect(evaluationApi.getApplicationsDetails).toHaveBeenLastCalledWith(
        5,
        5,
        component.sortBy(),
        component.sortDirection(),
        undefined,
        undefined,
        undefined,
      );
    });
  });

  // ---------------- LOAD WINDOW WITH FILTERS ----------------
  describe('Load Window with Filters', () => {
    it('should load applications window with filters and search set', async () => {
      const mockRes = {
        applications: [makeDetailApp('1'), makeDetailApp('2')],
        totalRecords: 5,
        currentIndex: 1,
        windowIndex: 1,
      };
      evaluationApi.getApplicationsDetailsWindow.mockReturnValueOnce(of(mockRes));
      component.selectedStatusFilters.set(['SENT']);
      component.selectedJobFilters.set(['AI Lab']);
      component.searchQuery.set('test-search');

      const testComp = component as unknown as {
        updateDocumentInformation: (id: string) => void;
        markCurrentApplicationAsInReview: () => Promise<void>;
        loadCarousel: (appId: string) => Promise<void>;
      };

      const updateDocSpy = vi.spyOn(testComp, 'updateDocumentInformation').mockImplementation(() => {});
      const markSpy = vi.spyOn(testComp, 'markCurrentApplicationAsInReview').mockResolvedValue(undefined);

      await testComp.loadCarousel('app-123');

      expect(component.totalRecords()).toBe(5);
      expect(component.applications().length).toBe(2);
      expect(component.carouselIndex()).toBe(1);
      expect(component.currentIndex()).toBe(1);
      expect(component.currentApplication()?.applicationDetailDTO.applicationId).toBe('2');
      expect(evaluationApi.getApplicationsDetailsWindow).toHaveBeenCalledWith(
        'app-123',
        7,
        component.sortBy(),
        component.sortDirection(),
        ['SENT'],
        ['AI Lab'],
        'test-search',
      );
      expect(updateDocSpy).toHaveBeenCalledWith('2');
      expect(markSpy).toHaveBeenCalled();
    });

    it('should handle undefined values gracefully in loadCarousel', async () => {
      const mockRes = {
        applications: undefined,
        totalRecords: undefined,
        currentIndex: undefined,
        windowIndex: undefined,
      };
      evaluationApi.getApplicationsDetailsWindow.mockReturnValueOnce(of(mockRes));

      const testComp = component as unknown as {
        updateDocumentInformation: (id: string) => void;
        markCurrentApplicationAsInReview: () => Promise<void>;
        loadCarousel: (appId: string) => Promise<void>;
      };

      const updateDocSpy = vi.spyOn(testComp, 'updateDocumentInformation').mockImplementation(() => {});
      const markSpy = vi.spyOn(testComp, 'markCurrentApplicationAsInReview').mockResolvedValue(undefined);

      await testComp.loadCarousel('app-456');

      expect(component.totalRecords()).toBe(0);
      expect(component.applications()).toEqual([]);
      expect(component.carouselIndex()).toBe(0);
      expect(component.currentIndex()).toBe(0);
      expect(component.currentApplication()).toBeUndefined();
      expect(updateDocSpy).not.toHaveBeenCalled();
      expect(markSpy).not.toHaveBeenCalled();
    });
  });
});

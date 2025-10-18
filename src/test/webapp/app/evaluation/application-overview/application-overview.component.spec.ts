import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ActivatedRoute, convertToParamMap, Params, Router } from '@angular/router';

import { ApplicationOverviewComponent } from 'app/evaluation/application-overview/application-overview.component';
import { ApplicationEvaluationResourceApiService } from 'app/generated/api/applicationEvaluationResourceApi.service';
import { ApplicationEvaluationOverviewDTO } from 'app/generated/model/applicationEvaluationOverviewDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { availableStatusOptions, sortableFields } from 'app/evaluation/filterSortOptions';
import { provideFontAwesomeTesting } from '../../../util/fontawesome.testing';

type GetOverviewsArgs = Parameters<ApplicationEvaluationResourceApiService['getApplicationsOverviews']>;

function makeOverview(id: string, partial?: Partial<ApplicationEvaluationOverviewDTO>): ApplicationEvaluationOverviewDTO {
  return {
    applicationId: id,
    name: `Name ${id}`,
    jobName: `Job ${id}`,
    state: 'SENT',
    appliedAt: '2025-10-01T00:00:00Z',
    createdAt: '2025-10-01T00:00:00Z',
    ...partial,
  } as ApplicationEvaluationOverviewDTO;
}

describe('ApplicationOverviewComponent', () => {
  let fixture: ComponentFixture<ApplicationOverviewComponent>;
  let component: ApplicationOverviewComponent;

  let api: {
    getAllJobNames: ReturnType<typeof vi.fn>;
    getApplicationsOverviews: ReturnType<typeof vi.fn>;
  };
  let router: Pick<Router, 'navigate'>;

  let q$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const lastGetArgs = (): GetOverviewsArgs => api.getApplicationsOverviews.mock.calls.at(-1) as GetOverviewsArgs;

  beforeEach(async () => {
    vi.useFakeTimers();

    api = {
      getAllJobNames: vi.fn().mockReturnValue(of(['B', 'A'])),
      getApplicationsOverviews: vi.fn().mockReturnValue(of({ applications: [makeOverview('1')], totalRecords: 1 })),
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    q$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [ApplicationOverviewComponent],
      providers: [
        { provide: ApplicationEvaluationResourceApiService, useValue: api },
        { provide: Router, useValue: router },
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
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationOverviewComponent);
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

  // ---------------- INIT ----------------
  it('initializes with job names sorted and first page loaded', async () => {
    expect(component).toBeTruthy();
    expect(api.getAllJobNames).toHaveBeenCalled();
    expect(api.getApplicationsOverviews).toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(component.allAvailableJobNames()).toEqual(['A', 'B']);
    expect(component.pageData().length).toBe(1);
    expect(component.total()).toBe(1);
  });

  // ---------------- COLUMNS & MAPPING ----------------
  it('exposes expected columns and state mappings', () => {
    const cols = component.columns();
    expect(cols.length).toBe(5);
    expect(cols.find(c => c.field === 'state')?.alignCenter).toBe(true);
    expect(cols.find(c => c.field === 'state')?.template).toBeDefined();
    expect(cols.find(c => c.field === 'actions')?.template).toBeDefined();

    const map = component.stateSeverityMap();
    expect(map.SENT).toBe('info');
    expect(map.ACCEPTED).toBe('success');
    expect(map.REJECTED).toBe('danger');
    expect(map.IN_REVIEW).toBe('warn');

    const labelsFromSource = availableStatusOptions.map(o => o.label);
    expect(component.availableStatusLabels).toEqual(labelsFromSource);
  });

  // ---------------- FILTERS ----------------
  it('applies/clears job & status filters and maps labels to keys (unknown kept as-is)', async () => {
    api.getApplicationsOverviews.mockClear();

    component.loadOnFilterEmit({ filterId: 'jobTitle', selectedValues: ['AI Group', 'HCI Lab'] });
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
    expect(lastGetArgs()[5]).toEqual(['AI Group', 'HCI Lab']);

    const known = availableStatusOptions[0];
    const unknown = 'status.unknown.label';
    component.loadOnFilterEmit({ filterId: 'status', selectedValues: [known.label, unknown] });
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
    const [, , , , statusFilters] = lastGetArgs();
    expect(statusFilters).toContain(known.key);
    expect(statusFilters).toContain(unknown);

    component.selectedJobFilters.set(['AI Group']);
    component.loadOnFilterEmit({ filterId: 'jobTitle', selectedValues: [] });
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
    expect(component.selectedJobFilters()).toEqual([]);
    expect(lastGetArgs()[5]).toBeUndefined();
  });

  // ---------------- SEARCH ----------------
  it('includes search in URL only when non-empty', async () => {
    (router.navigate as any).mockClear();
    api.getApplicationsOverviews.mockClear();

    component.loadOnSearchEmit('');
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
    let nav = (router.navigate as any).mock.calls.at(-1) as [unknown[], { queryParams: Params; replaceUrl: boolean }];
    expect(nav[1].queryParams.search).toBeUndefined();

    (router.navigate as any).mockClear();
    component.loadOnSearchEmit('abc');
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
    nav = (router.navigate as any).mock.calls.at(-1) as [unknown[], { queryParams: Params; replaceUrl: boolean }];
    expect(nav[1].queryParams.search).toBe('abc');
  });

  // ---------------- SORTING & QUERY PARAMS ----------------
  it('keeps user-initiated sort over query params; reacts to valid/invalid query params otherwise', async () => {
    api.getApplicationsOverviews.mockClear();

    component.loadOnSortEmit({ field: 'name', direction: 'ASC' });
    q$.next(convertToParamMap({ sortBy: 'createdAt', sortDir: 'DESC' }));
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
    expect(component.sortBy()).toBe('name');
    expect(component.sortDirection()).toBe('ASC');

    q$.next(convertToParamMap({ page: '-5', pageSize: '0', sortDir: 'INVALID' }));
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
    expect(component.page()).toBe(0);
    expect(component.pageSize()).toBe(1);
    expect(component.sortDirection()).toBe('DESC');

    q$.next(
      convertToParamMap({
        page: '2',
        pageSize: '25',
        sortBy: sortableFields[0].fieldName,
        sortDir: 'ASC',
        search: 'ml',
      }),
    );
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
    expect(component.page()).toBe(2);
    expect(component.pageSize()).toBe(25);
    expect(component.sortBy()).toBe(sortableFields[0].fieldName);
    expect(component.sortDirection()).toBe<'ASC' | 'DESC'>('ASC');
    expect(component.searchQuery()).toBe('ml');
  });

  // ---------------- NAVIGATION ----------------
  it('navigates to detail with current sort params and applicationId', async () => {
    (router.navigate as any).mockClear();
    component.sortBy.set('name');
    component.sortDirection.set('DESC');

    const app = makeOverview('abc');
    component.navigateToDetail(app);

    const call = (router.navigate as any).mock.calls.at(-1) as [string[], { queryParams: Params }];
    expect(call[0]).toEqual(['/evaluation/application']);
    expect(call[1].queryParams.applicationId).toBe('abc');
    expect(call[1].queryParams.sortBy).toBe('name');
    expect(call[1].queryParams.sortDirection).toBe('DESC');
  });

  // ---------------- SERVICE CALL ARGUMENT ----------------
  it('passes undefined for filters when none are selected', async () => {
    api.getApplicationsOverviews.mockClear();

    component.loadOnSearchEmit('');
    await fixture.whenStable();
    vi.runOnlyPendingTimers();

    const args = lastGetArgs();
    expect(args[4]).toBeUndefined();
    expect(args[5]).toBeUndefined();
    expect(args[6]).toBeUndefined();
  });

  // ---------------- API RESULT NORMALIZATION ----------------
  it('normalizes missing properties from API responses', async () => {
    api.getApplicationsOverviews
      .mockReturnValueOnce(of({} as any))
      .mockReturnValueOnce(of({ applications: undefined, totalRecords: 7 } as any));

    await component.loadPage();
    await vi.runAllTimersAsync();
    expect(component.pageData()).toEqual([]);
    expect(component.total()).toBe(0);

    await component.loadPage();
    await vi.runAllTimersAsync();
    expect(component.pageData()).toEqual([]);
    expect(component.total()).toBe(7);
  });

  // ---------------- TABLE PAGING EVENTS ----------------
  it('defaults first=0 and rows=10 when table event fields are undefined', async () => {
    const spy = vi.spyOn(component, 'loadPage').mockResolvedValue();
    component.loadOnTableEmit({ first: undefined, rows: undefined } as any);
    expect(component.page()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(spy).toHaveBeenCalled();
  });

  // ---------------- ERROR HANDLING ----------------
  it('sets available job names to [] when loading job names fails', async () => {
    api.getAllJobNames.mockReturnValueOnce(throwError(() => new Error('fail')));
    await component.loadAllJobNames();
    expect(component.allAvailableJobNames()).toEqual([]);
  });

  it('logs error to console when loadPage fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.getApplicationsOverviews.mockReturnValueOnce(throwError(() => new Error('API failure')));

    await component.loadPage();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load applications:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});

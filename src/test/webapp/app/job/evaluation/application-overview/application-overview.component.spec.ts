import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ActivatedRoute, convertToParamMap, Params, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ApplicationOverviewComponent } from 'app/evaluation/application-overview/application-overview.component';
import { ApplicationEvaluationResourceApiService } from 'app/generated/api/applicationEvaluationResourceApi.service';
import { ApplicationEvaluationOverviewDTO } from 'app/generated/model/applicationEvaluationOverviewDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { availableStatusOptions, sortableFields } from 'app/evaluation/filterSortOptions';
import { provideFontAwesomeTesting } from '../../../../util/fontawesome.testing';

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

      schemas: [NO_ERRORS_SCHEMA],
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

  it('should create and load initial data (job names sorted, page data & total set)', async () => {
    expect(component).toBeTruthy();
    expect(api.getAllJobNames).toHaveBeenCalled();

    expect(api.getApplicationsOverviews).toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(component.allAvailableJobNames()).toEqual(['A', 'B']);
    expect(component.pageData().length).toBe(1);
    expect(component.total()).toBe(1);
  });

  it('should compute columns with templates and expected fields', () => {
    const cols = component.columns();
    expect(cols.length).toBe(5);

    const stateCol = cols.find(c => c.field === 'state');
    expect(stateCol?.alignCenter).toBe(true);
    expect(stateCol?.template).toBeDefined();

    const actionsCol = cols.find(c => c.field === 'actions');
    expect(actionsCol?.template).toBeDefined();
  });

  it('should expose stateSeverityMap mapping', () => {
    const map = component.stateSeverityMap();
    expect(map.SENT).toBe('info');
    expect(map.ACCEPTED).toBe('success');
    expect(map.REJECTED).toBe('danger');
    expect(map.IN_REVIEW).toBe('warn');
  });

  it('should derive availableStatusLabels from availableStatusOptions', () => {
    const labelsFromSource = availableStatusOptions.map(o => o.label);
    expect(component.availableStatusLabels).toEqual(labelsFromSource);
  });

  it('should filter by job titles', async () => {
    api.getApplicationsOverviews.mockClear();

    component.loadOnFilterEmit({
      filterId: 'jobTitle',
      selectedValues: ['AI Group', 'HCI Lab'],
    });
    vi.runOnlyPendingTimers();
    await fixture.whenStable();

    const [, , , , , jobFilters] = api.getApplicationsOverviews.mock.calls.at(-1) as GetOverviewsArgs;
    expect(jobFilters).toEqual(['AI Group', 'HCI Lab']);
  });

  it('should apply both job and status filters simultaneously', async () => {
    api.getApplicationsOverviews.mockClear();

    component.loadOnFilterEmit({
      filterId: 'jobTitle',
      selectedValues: ['AI Group'],
    });

    component.loadOnFilterEmit({
      filterId: 'status',
      selectedValues: [availableStatusOptions[0].label],
    });

    vi.runOnlyPendingTimers();
    await fixture.whenStable();

    const args = api.getApplicationsOverviews.mock.calls.at(-1) as GetOverviewsArgs;
    expect(args[4]).toBeDefined();
    expect(args[5]).toBeDefined();
  });

  it('should clear filters and reload when filter is emptied', async () => {
    component.selectedJobFilters.set(['AI Group']);

    component.loadOnFilterEmit({
      filterId: 'jobTitle',
      selectedValues: [],
    });

    vi.runOnlyPendingTimers();
    await fixture.whenStable();

    expect(component.selectedJobFilters()).toEqual([]);
    const args = api.getApplicationsOverviews.mock.calls.at(-1) as GetOverviewsArgs;
    expect(args[5]).toBeUndefined();
  });

  it('should map translated status labels to enum keys and pass them as filters (fallback on unknown)', async () => {
    api.getApplicationsOverviews.mockClear();

    const one = availableStatusOptions[0];
    const knownLabel = one.label;
    const expectedKey = one.key;
    const unknownLabel = 'status.unknown.label';

    component.loadOnFilterEmit({
      filterId: 'status',
      selectedValues: [knownLabel, unknownLabel],
    });
    vi.runOnlyPendingTimers();
    await fixture.whenStable();

    const [, , , , statusFilters] = api.getApplicationsOverviews.mock.calls.at(-1) as GetOverviewsArgs;
    expect(statusFilters).toContain(expectedKey);
    expect(statusFilters).toContain(unknownLabel);
  });

  it('should sort and pass sort field/direction; user-initiated sort should not be overridden by query params immediately', async () => {
    api.getApplicationsOverviews.mockClear();

    component.loadOnSortEmit({ field: 'name', direction: 'ASC' });

    q$.next(convertToParamMap({ sortBy: 'createdAt', sortDir: 'DESC' }));

    vi.runOnlyPendingTimers();
    await fixture.whenStable();

    expect(component.sortBy()).toBe('name');
    expect(component.sortDirection()).toBe('ASC');
  });

  it('should handle invalid query params gracefully', async () => {
    q$.next(
      convertToParamMap({
        page: '-5',
        pageSize: '0',
        sortDir: 'INVALID',
      }),
    );

    vi.runOnlyPendingTimers();
    await fixture.whenStable();

    expect(component.page()).toBe(0);
    expect(component.pageSize()).toBe(1);
    expect(component.sortDirection()).toBe('DESC');
  });

  it('should react to query params (page, pageSize, sortBy, sortDir, search) when not user-initiated', async () => {
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

  it('should navigate to detail with current sort params and applicationId', async () => {
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

  it('should include search in URL query params only when non-empty', async () => {
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

  it('should handle getAllJobNames failure by setting empty list', async () => {
    api.getAllJobNames.mockReturnValueOnce(throwError(() => new Error('fail')));

    await component.loadAllJobNames();
    expect(component.allAvailableJobNames()).toEqual([]);
  });

  it('should call service with undefined filters when none selected (not empty arrays)', async () => {
    api.getApplicationsOverviews.mockClear();

    component.loadOnSearchEmit('');
    await fixture.whenStable();
    vi.runOnlyPendingTimers();

    const args = api.getApplicationsOverviews.mock.calls.at(-1) as GetOverviewsArgs;

    expect(args[4]).toBeUndefined();
    expect(args[5]).toBeUndefined();
    expect(args[6]).toBeUndefined();
  });
});

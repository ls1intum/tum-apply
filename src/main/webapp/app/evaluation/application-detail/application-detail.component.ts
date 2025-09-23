import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from 'app/service/toast-service';
import { DividerModule } from 'primeng/divider';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';

import { ApplicationCarouselComponent } from '../../shared/components/organisms/application-carousel/application-carousel.component';
import { EvaluationService } from '../service/evaluation.service';
import { SortOption } from '../../shared/components/molecules/filter-sort-bar/filter-sort-bar.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { ReviewDialogComponent } from '../../shared/components/molecules/review-dialog/review-dialog.component';
import TranslateDirective from '../../shared/language/translate.directive';
import { Section } from '../components/section/section';
import { SubSection } from '../components/sub-section/sub-section';
import { DescriptionList } from '../components/description-list/description-list';
import { LinkList } from '../components/link-list/link-list';
import { Prose } from '../components/prose/prose';
import { DocumentSection } from '../components/document-section/document-section';
import { ApplicationEvaluationResourceApiService } from '../../generated/api/applicationEvaluationResourceApi.service';
import { ApplicationResourceApiService } from '../../generated/api/applicationResourceApi.service';
import { ApplicationEvaluationDetailDTO } from '../../generated/model/applicationEvaluationDetailDTO';
import { ApplicationDocumentIdsDTO } from '../../generated/model/applicationDocumentIdsDTO';
import { AcceptDTO } from '../../generated/model/acceptDTO';
import { RejectDTO } from '../../generated/model/rejectDTO';
import { ApplicationEvaluationDetailListDTO } from '../../generated/model/applicationEvaluationDetailListDTO';
import { ApplicationForApplicantDTO } from '../../generated/model/applicationForApplicantDTO';
import { availableStatusOptions } from '../filterSortOptions';

import ApplicationStateEnum = ApplicationForApplicantDTO.ApplicationStateEnum;

const WINDOW_SIZE = 7;

@Component({
  selector: 'jhi-application-detail',
  imports: [
    ApplicationCarouselComponent,
    DividerModule,
    SearchFilterSortBar,
    TranslateModule,
    ButtonComponent,
    ReviewDialogComponent,
    TranslateDirective,
    Section,
    SubSection,
    DescriptionList,
    LinkList,
    Prose,
    DocumentSection,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  applications = signal<ApplicationEvaluationDetailDTO[]>([]);
  totalRecords = signal<number>(0);
  currentIndex = signal<number>(0);
  windowIndex = signal<number>(0);
  searchQuery = signal<string>('');

  currentApplication = signal<ApplicationEvaluationDetailDTO | undefined>(undefined);
  currentDocumentIds = signal<ApplicationDocumentIdsDTO | undefined>(undefined);
  sortBy = signal<string>('createdAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  readonly selectedJobFilters = signal<string[]>([]);
  readonly selectedStatusFilters = signal<string[]>([]);

  readonly availableStatusOptions = availableStatusOptions;

  readonly availableStatusLabels = this.availableStatusOptions.map(option => option.label);

  allAvailableJobNames = signal<string[]>([]);

  // accept/reject dialog
  reviewDialogVisible = signal<boolean>(false);
  reviewDialogMode = signal<'ACCEPT' | 'REJECT'>('ACCEPT');

  half = Math.floor(WINDOW_SIZE / 2); // Half the window size, used for centering

  canReview = computed(() => {
    const currentApplication = this.currentApplication();
    if (!currentApplication) {
      return false;
    }
    const state = currentApplication.applicationDetailDTO.applicationState;
    return state !== 'ACCEPTED' && state !== 'REJECTED';
  });

  // TODO: replace this with values from filterSortOptions in new sorting style
  readonly sortOptions: SortOption[] = [
    {
      displayName: 'Applied at (Oldest to Newest)',
      field: 'createdAt',
      direction: 'ASC',
    },
    {
      displayName: 'Applied at (Newest to Oldest)',
      field: 'createdAt',
      direction: 'DESC',
    },
  ];

  protected readonly WINDOW_SIZE = WINDOW_SIZE;

  private isSearchInitiatedByUser = false;

  private readonly evaluationResourceService = inject(ApplicationEvaluationResourceApiService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly applicationResourceService = inject(ApplicationResourceApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private toastService = inject(ToastService);

  private readonly qpSignal = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor() {
    void this.init();
  }

  async init(): Promise<void> {
    effect(() => {
      const qp = this.qpSignal();
      this.sortBy.set(qp.get('sortBy') ?? this.sortOptions[0].field);
      const rawSD = qp.get('sortDir');
      this.sortDirection.set(rawSD === 'ASC' || rawSD === 'DESC' ? rawSD : 'DESC');

      if (!this.isSearchInitiatedByUser) {
        this.searchQuery.set(qp.get('search') ?? '');
      }
      this.isSearchInitiatedByUser = false;
    });
    await this.loadAllJobNames();

    const id = this.qpSignal().get('applicationId');
    if (id) {
      void this.loadWindow(id);
    } else {
      // Load initial batch of applications
      void this.loadInitialPage();
    }
  }

  async loadAllJobNames(): Promise<void> {
    try {
      const jobNames = await firstValueFrom(this.evaluationResourceService.getAllJobNames());
      this.allAvailableJobNames.set(jobNames.sort());
    } catch {
      this.allAvailableJobNames.set([]);
    }
  }

  onSearchEmit(searchQuery: string): void {
    this.isSearchInitiatedByUser = true;
    this.searchQuery.set(searchQuery);
    void this.loadInitialPage();
  }

  onFilterEmit(filterChange: FilterChange): void {
    if (filterChange.filterLabel === 'evaluation.tableHeaders.job') {
      this.selectedJobFilters.set(filterChange.selectedValues);
      void this.loadInitialPage();
    } else if (filterChange.filterLabel === 'evaluation.tableHeaders.status') {
      const enumValues = this.mapTranslationKeysToEnumValues(filterChange.selectedValues);
      this.selectedStatusFilters.set(enumValues);
      void this.loadInitialPage();
    }
  }

  // Navigate to next application
  onNext(): void {
    if (this.currentIndex() >= this.totalRecords() - 1) return;

    this.currentIndex.update(v => v + 1);
    this.windowIndex.update(v => v + 1);
    const nextApp = this.applications()[this.windowIndex()];
    this.currentApplication.set(nextApp);

    void this.markCurrentApplicationAsInReview();

    if (this.currentIndex() + this.half < this.totalRecords()) {
      // Load next item if within bounds
      void this.loadNext(this.currentIndex() + this.half);
    } else {
      // Otherwise update the visible window
      this.updateApplications();
    }
    this.updateUrlQueryParams();
  }

  // Navigate to previous application
  onPrev(): void {
    if (this.currentIndex() <= 0) return;

    this.currentIndex.update(v => v - 1);
    this.windowIndex.update(v => v - 1);
    const prevApp = this.applications()[this.windowIndex()];
    this.currentApplication.set(prevApp);

    void this.markCurrentApplicationAsInReview();

    if (this.currentIndex() - this.half >= 0) {
      // Load previous item if within bounds
      void this.loadPrev(this.currentIndex() - this.half);
    } else {
      // Otherwise update the visible window
      this.updateApplications();
    }
    this.updateUrlQueryParams();
  }

  openAcceptDialog(): void {
    this.reviewDialogMode.set('ACCEPT');
    this.reviewDialogVisible.set(true);
  }

  openRejectDialog(): void {
    this.reviewDialogMode.set('REJECT');
    this.reviewDialogVisible.set(true);
  }

  async acceptApplication(acceptDTO: AcceptDTO): Promise<void> {
    const application = this.currentApplication();

    if (application) {
      this.updateCurrentApplicationState('ACCEPTED');

      if (acceptDTO.closeJob === true) {
        // update the state of all applications in memory for this job
        this.rejectOtherApplicationsOfJob(application.jobId ?? '');
      }
      this.reviewDialogVisible.set(false);
      await firstValueFrom(this.evaluationResourceService.acceptApplication(application.applicationDetailDTO.applicationId, acceptDTO));
    }
  }

  async rejectApplication(rejectDTO: RejectDTO): Promise<void> {
    const application = this.currentApplication();

    if (application) {
      this.updateCurrentApplicationState('REJECTED');
      this.reviewDialogVisible.set(false);
      await firstValueFrom(this.evaluationResourceService.rejectApplication(application.applicationDetailDTO.applicationId, rejectDTO));
    }
  }

  async markCurrentApplicationAsInReview(): Promise<void> {
    const application = this.currentApplication();

    if (application && application.applicationDetailDTO.applicationState === 'SENT') {
      this.updateCurrentApplicationState('IN_REVIEW');
      await firstValueFrom(this.evaluationResourceService.markApplicationAsInReview(application.applicationDetailDTO.applicationId));
    }
  }

  updateCurrentApplicationState(newState: ApplicationStateEnum): void {
    const current = this.currentApplication();

    if (!current) {
      console.error('Current application is undefined');
      return;
    }

    const id = current.applicationDetailDTO.applicationId;

    // update applications
    this.applications.update(apps =>
      apps.map(app =>
        app.applicationDetailDTO.applicationId === id
          ? {
              ...app,
              applicationDetailDTO: {
                ...app.applicationDetailDTO,
                applicationState: newState,
              },
            }
          : app,
      ),
    );

    // update current application
    this.currentApplication.set({
      ...current,
      applicationDetailDTO: {
        ...current.applicationDetailDTO,
        applicationState: newState,
      },
    });
  }

  /**
   * sets the Application State of all Applications (in memory) to "REJECTED" for a specific job
   */
  rejectOtherApplicationsOfJob(jobId: string): void {
    this.applications.update(apps =>
      apps.map(application =>
        application.jobId === jobId &&
        (application.applicationDetailDTO.applicationState === 'SENT' || application.applicationDetailDTO.applicationState === 'IN_REVIEW')
          ? {
              ...application,
              applicationDetailDTO: {
                ...application.applicationDetailDTO,
                applicationState: 'REJECTED',
              },
            }
          : application,
      ),
    );
  }

  private mapTranslationKeysToEnumValues(translationKeys: string[]): string[] {
    const keyMap = new Map(this.availableStatusOptions.map(option => [option.label, option.key]));
    return translationKeys.map(key => keyMap.get(key) ?? key);
  }

  /**
   * Loads a page of applications from backend.
   * Also updates total count of applications.
   */
  private async loadPage(offset: number, limit: number): Promise<ApplicationEvaluationDetailDTO[] | undefined> {
    try {
      const statusFilters = this.selectedStatusFilters().length > 0 ? this.selectedStatusFilters() : [];
      const jobFilters = this.selectedJobFilters().length > 0 ? this.selectedJobFilters() : [];
      const search = this.searchQuery();
      const res: ApplicationEvaluationDetailListDTO = await firstValueFrom(
        this.evaluationResourceService.getApplicationsDetails(
          offset,
          limit,
          this.sortBy(),
          this.sortDirection(),
          statusFilters.length ? statusFilters : undefined,
          jobFilters.length ? jobFilters : undefined,
          search || undefined,
        ),
      );
      this.totalRecords.set(res.totalRecords ?? 0);
      return res.applications ?? undefined;
    } catch (error) {
      console.error('Failed to load applications:', error);
      return undefined;
    }
  }

  private async loadWindow(applicationId: string): Promise<void> {
    try {
      const statusFilters = this.selectedStatusFilters().length > 0 ? this.selectedStatusFilters() : [];
      const jobFilters = this.selectedJobFilters().length > 0 ? this.selectedJobFilters() : [];

      const search = this.searchQuery();
      const res: ApplicationEvaluationDetailListDTO = await firstValueFrom(
        this.evaluationResourceService.getApplicationsDetailsWindow(
          applicationId,
          WINDOW_SIZE,
          this.sortBy(),
          this.sortDirection(),
          statusFilters.length ? statusFilters : undefined,
          jobFilters.length ? jobFilters : undefined,
          search || undefined,
        ),
      );
      this.totalRecords.set(res.totalRecords ?? 0);
      this.applications.set(res.applications ?? []);
      this.windowIndex.set(res.windowIndex ?? 0);
      this.currentIndex.set(res.currentIndex ?? 0);
      this.currentApplication.set(this.applications()[this.windowIndex()]);
      this.updateDocumentInformation(this.applications()[this.windowIndex()].applicationDetailDTO.applicationId);
      void this.markCurrentApplicationAsInReview();
    } catch (error) {
      console.error('Failed to load applications:', error);
      return undefined;
    }
  }

  /**
   * Loads the next application and appends it to the right side of the current window.
   * Adjusts window to keep the size fixed (WINDOW_SIZE).
   */
  private async loadNext(i: number): Promise<void> {
    const newEntry = await this.loadPage(i, 1);
    if (newEntry) {
      let apps = [...this.applications(), ...newEntry];
      // Keep window size fixed
      if (apps.length > WINDOW_SIZE) {
        apps = apps.slice(apps.length - WINDOW_SIZE);
        this.windowIndex.update(v => v - 1); // Adjust index to match slice
      }
      this.applications.set(apps);
      this.updateDocumentInformation(apps[this.windowIndex()].applicationDetailDTO.applicationId);
    }
  }

  /**
   * Loads the previous application and prepends it to the left side of the window.
   * Adjusts window to keep the size fixed (WINDOW_SIZE).
   */
  private async loadPrev(i: number): Promise<void> {
    const newEntry = await this.loadPage(i, 1);
    if (newEntry) {
      let apps = [...newEntry, ...this.applications()];
      if (apps.length > WINDOW_SIZE) {
        apps = apps.slice(0, WINDOW_SIZE);
      }
      this.windowIndex.update(v => v + 1); // Adjust index to match new position
      this.applications.set(apps);
      this.updateDocumentInformation(apps[this.windowIndex()].applicationDetailDTO.applicationId);
    }
  }

  /**
   * Loads the initial window of applications when component initializes.
   * Uses half of the window size to center the first item.
   */
  private async loadInitialPage(): Promise<void> {
    const data = await this.loadPage(0, this.half + 1);
    if (data) {
      this.currentIndex.set(0);
      this.windowIndex.set(0);
      this.applications.set(data);
      this.currentApplication.set(data[0]);
      void this.markCurrentApplicationAsInReview();
      this.updateUrlQueryParams();
      this.updateDocumentInformation(data[this.windowIndex()].applicationDetailDTO.applicationId);
    }
  }

  /**
   * Trims or shifts the application window when the internal index drifts
   * outside the center (e.g. after multiple navigations).
   * Ensures the centered item is properly positioned in the middle.
   */
  private updateApplications(): void {
    const windowIndex = this.windowIndex();
    const apps = this.applications();

    if (windowIndex > this.half) {
      // Trim the front of the window
      const diff = windowIndex - this.half;
      this.applications.set(apps.slice(diff));
      this.windowIndex.update(v => v - diff);
    } else if (apps.length - windowIndex - 1 > this.half) {
      // Trim the end of the window
      const diff = apps.length - windowIndex - 1 - this.half;
      this.applications.set(apps.slice(0, apps.length - diff));
    }
    this.updateDocumentInformation(this.applications()[this.windowIndex()].applicationDetailDTO.applicationId);
  }

  private buildQueryParams(): Params {
    const baseParams: Params = {
      sortBy: this.sortBy(),
      sortDir: this.sortDirection(),
      applicationId: this.currentApplication()?.applicationDetailDTO.applicationId,
    };

    if (this.searchQuery()) {
      baseParams.search = this.searchQuery();
    }

    const filterParams: Params = {};

    return {
      ...baseParams,
      ...filterParams,
    };
  }

  private updateUrlQueryParams(): void {
    const qp: Params = this.buildQueryParams();
    void this.router.navigate([], {
      queryParams: qp,
      replaceUrl: true,
    });
  }

  private updateDocumentInformation(applicationId: string): void {
    firstValueFrom(this.applicationResourceService.getDocumentDictionaryIds(applicationId))
      .then(ids => {
        this.currentDocumentIds.set(ids);
      })
      .catch(() => this.toastService.showError({ summary: 'Error', detail: 'fetching the document ids for this application' }));
  }
}

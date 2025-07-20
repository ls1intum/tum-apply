import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import DocumentGroupComponent from 'app/shared/components/molecules/document-group/document-group.component';
import { ToastComponent } from 'app/shared/toast/toast.component';
import { ToastService } from 'app/service/toast-service';

import { ApplicationCarouselComponent } from '../../shared/components/organisms/application-carousel/application-carousel.component';
import { FilterField } from '../../shared/filter';
import { EvaluationService } from '../service/evaluation.service';
import { FilterSortBarComponent } from '../../shared/components/molecules/filter-sort-bar/filter-sort-bar.component';
import { sortOptions } from '../filterSortOptions';
import {
  AcceptDTO,
  ApplicationDocumentIdsDTO,
  ApplicationEvaluationDetailDTO,
  ApplicationEvaluationDetailListDTO,
  ApplicationEvaluationResourceService,
  ApplicationForApplicantDTO,
  ApplicationResourceService,
  RejectDTO,
} from '../../generated';
import { ApplicationDetailCardComponent } from '../../shared/components/organisms/application-detail-card/application-detail-card.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { ReviewDialogComponent } from '../../shared/components/molecules/review-dialog/review-dialog.component';
import TranslateDirective from '../../shared/language/translate.directive';

import ApplicationStateEnum = ApplicationForApplicantDTO.ApplicationStateEnum;

const WINDOW_SIZE = 7;

@Component({
  selector: 'jhi-application-detail',
  imports: [
    ApplicationCarouselComponent,
    FilterSortBarComponent,
    ApplicationDetailCardComponent,
    TranslateModule,
    ButtonComponent,
    ReviewDialogComponent,
    TranslateDirective,
    DocumentGroupComponent,
    ToastComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  applications = signal<ApplicationEvaluationDetailDTO[]>([]);
  totalRecords = signal<number>(0);
  currentIndex = signal<number>(0);
  windowIndex = signal<number>(0);

  currentApplication = signal<ApplicationEvaluationDetailDTO | undefined>(undefined);
  currentDocumentIds = signal<ApplicationDocumentIdsDTO | undefined>(undefined);
  filters = signal<FilterField[]>([]);
  sortBy = signal<string>('createdAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

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

  protected readonly sortOptions = sortOptions;
  protected readonly WINDOW_SIZE = WINDOW_SIZE;

  private readonly evaluationResourceService = inject(ApplicationEvaluationResourceService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly applicationResourceService = inject(ApplicationResourceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly qpSignal = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(private toastService: ToastService) {
    void this.init();
  }

  async init(): Promise<void> {
    effect(() => {
      const qp = this.qpSignal();
      this.sortBy.set(qp.get('sortBy') ?? this.sortOptions[0].field);
      const rawSD = qp.get('sortDir');
      this.sortDirection.set(rawSD === 'ASC' || rawSD === 'DESC' ? rawSD : 'DESC');
    });
    void this.initFilterFields();
    await this.initFilterFields();

    const id = this.qpSignal().get('applicationId');
    if (id) {
      void this.loadWindow(id);
    } else {
      // Load initial batch of applications
      void this.loadInitialPage();
    }
  }

  async initFilterFields(): Promise<void> {
    const filters = await this.evaluationService.getFilterFields();
    const params = this.qpSignal();
    filters.forEach(filter => filter.withSelectionFromParam(params));
    this.filters.set(filters);
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

  onFilterChange(filters: FilterField[]): void {
    this.filters.set(filters);
    void this.loadInitialPage();
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

  /**
   * Loads a page of applications from backend.
   * Also updates total count of applications.
   */
  private async loadPage(offset: number, limit: number): Promise<ApplicationEvaluationDetailDTO[] | undefined> {
    try {
      const filtersByKey = this.evaluationService.collectFiltersByKey(this.filters());
      const statusFilters = Array.from(filtersByKey['status'] ?? []);
      const jobFilters = Array.from(filtersByKey['job'] ?? []);
      const res: ApplicationEvaluationDetailListDTO = await firstValueFrom(
        this.evaluationResourceService.getApplicationsDetails(
          offset,
          limit,
          this.sortBy(),
          this.sortDirection(),
          statusFilters.length ? statusFilters : undefined,
          jobFilters.length ? jobFilters : undefined,
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
      const filtersByKey = this.evaluationService.collectFiltersByKey(this.filters());
      const statusFilters = Array.from(filtersByKey['status'] ?? []);
      const jobFilters = Array.from(filtersByKey['job'] ?? []);
      const res: ApplicationEvaluationDetailListDTO = await firstValueFrom(
        this.evaluationResourceService.getApplicationsDetailsWindow(
          applicationId,
          WINDOW_SIZE,
          this.sortBy(),
          this.sortDirection(),
          statusFilters.length ? statusFilters : undefined,
          jobFilters.length ? jobFilters : undefined,
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

    const filterParams: Params = {};
    this.filters().forEach(f => {
      const entry = f.getQueryParamEntry();
      if (entry) {
        filterParams[entry[0]] = entry[1];
      }
    });

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

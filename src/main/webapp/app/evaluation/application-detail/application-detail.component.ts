import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApplicationCarouselComponent } from '../../shared/components/organisms/application-carousel/application-carousel.component';
import { FilterField } from '../../shared/filter';
import { ApplicationEvaluationDetailDTO, ApplicationEvaluationDetailListDTO, ApplicationEvaluationResourceService } from '../../generated';
import { EvaluationService } from '../service/evaluation.service';
import { FilterSortBarComponent } from '../../shared/components/molecules/filter-sort-bar/filter-sort-bar.component';
import { sortOptions } from '../filterSortOptions';

const WINDOW_SIZE = 7;

@Component({
  selector: 'jhi-application-detail',
  imports: [ApplicationCarouselComponent, FilterSortBarComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  applications = signal<ApplicationEvaluationDetailDTO[]>([]);
  totalRecords = signal<number>(0);
  currentIndex = signal<number>(0);
  windowIndex = signal<number>(0);

  currentApplication = signal<ApplicationEvaluationDetailDTO | undefined>(undefined);
  filters = signal<FilterField[]>([]);
  sortBy = signal<string>('createdAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  half = Math.floor(WINDOW_SIZE / 2); // Half the window size, used for centering

  protected readonly sortOptions = sortOptions;
  protected readonly WINDOW_SIZE = WINDOW_SIZE;

  private readonly evaluationResourceService = inject(ApplicationEvaluationResourceService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly qpSignal = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor() {
    if (this.currentApplication()) {
      // TODO: Load window centered around given application
    } else {
      // Load initial batch of applications
      void this.loadInitialPage();
    }
  }

  // Navigate to next application
  onNext(): void {
    if (this.currentIndex() >= this.totalRecords() - 1) return;

    this.currentIndex.update(v => v + 1);
    this.windowIndex.update(v => v + 1);

    if (this.currentIndex() + this.half < this.totalRecords()) {
      // Load next item if within bounds
      void this.loadNext(this.currentIndex() + this.half);
    } else {
      // Otherwise update the visible window
      this.updateApplications();
    }
  }

  // Navigate to previous application
  onPrev(): void {
    if (this.currentIndex() <= 0) return;

    this.currentIndex.update(v => v - 1);
    this.windowIndex.update(v => v - 1);

    if (this.currentIndex() - this.half >= 0) {
      // Load previous item if within bounds
      void this.loadPrev(this.currentIndex() - this.half);
    } else {
      // Otherwise update the visible window
      this.updateApplications();
    }
  }

  /**
   * Loads a page of applications from backend.
   * Also updates total count of applications.
   */
  private async loadPage(offset: number, limit: number): Promise<ApplicationEvaluationDetailDTO[] | undefined> {
    try {
      const res: ApplicationEvaluationDetailListDTO = await firstValueFrom(
        this.evaluationResourceService.getApplicationsDetails(offset, limit, this.sortBy(), this.sortDirection()),
      );
      this.totalRecords.set(res.totalRecords ?? 0);
      return res.applications ?? undefined;
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
    }
  }

  /**
   * Loads the initial window of applications when component initializes.
   * Uses half of the window size to center the first item.
   */
  private async loadInitialPage(): Promise<void> {
    const data = await this.loadPage(0, this.half + 1);
    if (data) {
      this.applications.set(data);
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
  }

  private buildQueryParams(): Params {
    const baseParams: Params = {
      sortBy: this.sortBy(),
      sortDir: this.sortDirection(),
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
    this.router.navigate([], {
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

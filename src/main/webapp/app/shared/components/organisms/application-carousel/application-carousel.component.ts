import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ApplicationCardComponent } from '../../molecules/application-card/application-card.component';
import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../../../generated';
import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';

// Constants defining the default visible slots and application window size
const VISIBLE_DESKTOP = 3;
const WINDOW_SIZE = 7;

/**
 * ApplicationCarouselComponent
 *
 * This component displays a horizontal carousel of  applications,
 * allowing reviewers to navigate through applications
 *
 * The component handles:
 * - Lazy loading of applications from the backend.
 * - Maintaining a sliding window of applications with fixed size.
 * - Centering logic for focused/active application.
 * - Responsiveness by adapting the number of visible applications
 * - Keyboard accessibility and visual cues.
 *
 */
@Component({
  selector: 'jhi-application-carousel',
  imports: [ApplicationCardComponent, FontAwesomeModule, ButtonComponent, TranslateModule, TranslateDirective],
  templateUrl: './application-carousel.component.html',
  styleUrls: ['./application-carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    role: 'region',
    'aria-roledescription': 'carousel',
    'aria-label': 'Applications carousel',
  },
})
export class ApplicationCarouselComponent {
  readonly evaluationService = inject(ApplicationEvaluationResourceService);

  // Inputs to customize carousel behavior
  applicationId = input<string | undefined>(undefined);
  sortBy = input<string>('createdAt');
  sortDirection = input<'ASC' | 'DESC'>('DESC');

  // Reactive state signals
  totalCount = signal(0); // Total number of applications
  currentIndex = signal(0); // Global index of currently selected application
  windowIndex = signal(0); // Local index in current application window
  applications = signal<ApplicationEvaluationOverviewDTO[]>([]);
  cardsVisible = signal(VISIBLE_DESKTOP); // Number of visible cards (responsive)

  // Half of the window size — used for centering logic
  half = Math.floor(WINDOW_SIZE / 2); // Half the window size, used for centering

  isStart = computed(() => {
    return this.currentIndex() === 0;
  });

  isEnd = computed(() => {
    return this.currentIndex() === this.totalCount() - 1 || this.totalCount() === 0;
  });

  // Compute the list of applications to display (always fills visible slots with null)
  readonly visibleApps = computed(() => {
    const size = this.cardsVisible();
    const half = Math.floor(size / 2);
    const result: (ApplicationEvaluationOverviewDTO | undefined)[] = [];

    for (let offset = -half; offset <= half; offset++) {
      const idx = this.windowIndex() + offset;
      if (idx < 0 || idx >= WINDOW_SIZE) {
        result.push(undefined); // Fill with nulls if out of bounds
      } else {
        result.push(this.applications()[idx]);
      }
    }

    return result;
  });

  // Index of the center card, used to determine which card is active/focused
  readonly middle = computed(() => {
    return Math.floor(this.cardsVisible() / 2);
  });

  constructor(private readonly bp: BreakpointObserver) {
    const SMALL = '(max-width: 1024px)';
    const ULTRA_WIDE = '(min-width: 1920px)';

    const breakpoint = toSignal<BreakpointState | null>(this.bp.observe([SMALL, ULTRA_WIDE]), { initialValue: null });

    effect(() => {
      const result = breakpoint();
      if (!result) return;
      if (result.breakpoints[SMALL]) {
        this.cardsVisible.set(1);
      } else if (result.breakpoints[ULTRA_WIDE]) {
        this.cardsVisible.set(5);
      } else {
        this.cardsVisible.set(VISIBLE_DESKTOP);
      }
    });

    if (this.applicationId() !== undefined) {
      // TODO: Load window centered around given application
    } else {
      // Load initial batch of applications
      void this.loadInitialPage();
    }
  }

  // Listen to arrow keys for navigation
  @HostListener('document:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
    }
  }

  // Navigate to next application
  next(): void {
    if (this.currentIndex() >= this.totalCount() - 1) return;

    this.currentIndex.update(v => v + 1);
    this.windowIndex.update(v => v + 1);

    if (this.currentIndex() + this.half < this.totalCount()) {
      // Load next item if within bounds
      void this.loadNext(this.currentIndex() + this.half);
    } else {
      // Otherwise update the visible window
      this.updateApplications();
    }
  }

  // Navigate to previous application
  prev(): void {
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
  private async loadPage(offset: number, limit: number): Promise<ApplicationEvaluationOverviewDTO[] | undefined> {
    try {
      const res = await firstValueFrom(this.evaluationService.getApplicationsDetails(offset, limit, this.sortBy(), this.sortDirection()));
      this.totalCount.set(res.totalRecords ?? 0);
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
}

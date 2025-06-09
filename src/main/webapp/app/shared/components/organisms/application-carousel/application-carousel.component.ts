import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, input, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';

import { ApplicationCardComponent } from '../../molecules/application-card/application-card.component';
import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../../../generated';
import { ButtonComponent } from '../../atoms/button/button.component';

// Constants defining the default visible slots and application window size
const VISIBLE_DESKTOP = 3;
const WINDOW_SIZE = 5;

// Interface for pagination
export interface Page {
  offset: number;
  limit: number;
}

@Component({
  selector: 'jhi-application-carousel',
  imports: [ApplicationCardComponent, FontAwesomeModule, ButtonComponent],
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
export class ApplicationCarouselComponent implements OnInit {
  readonly evaluationService = inject(ApplicationEvaluationResourceService);

  // Inputs to customize carousel behavior
  applicationId = input<string | null>(null);
  sortBy = input<string>('createdAt');
  sortDirection = input<'ASC' | 'DESC'>('DESC');

  // Reactive state signals
  totalCount = signal(0); // Total number of applications
  currentIndex = signal(0); // Global index of currently selected application
  windowIndex = signal(0); // Local index in current application window
  applications = signal<ApplicationEvaluationOverviewDTO[]>([]);
  cardsVisible = signal(VISIBLE_DESKTOP); // Number of visible cards (responsive)

  half = Math.floor(WINDOW_SIZE / 2); // Half the window size, used for centering

  // Compute the list of applications to display (always fills visible slots with null)
  readonly visibleApps = computed(() => {
    const size = this.cardsVisible();
    const half = Math.floor(size / 2);
    const result: (ApplicationEvaluationOverviewDTO | null)[] = [];

    for (let offset = -half; offset <= half; offset++) {
      const idx = this.windowIndex() + offset;
      if (idx < 0 || idx >= WINDOW_SIZE) {
        result.push(null); // Fill with nulls if out of bounds
      } else {
        result.push(this.applications()[idx]);
      }
    }

    return result;
  });

  // Determine if a slot should be disabled (only center is enabled)
  readonly isDisabled = computed(() => {
    const middle = Math.floor(this.cardsVisible() / 2);
    return (slot: number) => slot !== middle;
  });

  constructor(private readonly bp: BreakpointObserver) {
    // Update visible card count based on screen size
    this.bp.observe([Breakpoints.Handset]).subscribe(({ matches }) => {
      this.cardsVisible.set(matches ? 1 : VISIBLE_DESKTOP);
    });
  }

  ngOnInit(): void {
    if (this.applicationId() !== null) {
      // TODO: Load and center on a specific application by ID
    } else {
      // Load initial batch of applications
      void this.loadInitialPage();
    }
  }

  // Listen to arrow keys for navigation
  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
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

  // Load a page of applications from server
  private async loadPage(offset: number, limit: number): Promise<ApplicationEvaluationOverviewDTO[] | null> {
    try {
      const res = await firstValueFrom(this.evaluationService.getApplications(offset, limit, this.sortBy(), this.sortDirection()));
      // Update total count after async delay to ensure signal update stability
      setTimeout(() => {
        this.totalCount.set(res.totalRecords ?? 0);
      });
      return res.applications ?? null;
    } catch (error) {
      console.error('Failed to load applications:', error);
      return null;
    }
  }

  // Load next application and append to the right
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

  // Load previous application and prepend to the left
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

  // Load the first page of applications on init
  private async loadInitialPage(): Promise<void> {
    const data = await this.loadPage(0, this.half + 1);
    if (data) {
      this.applications.set(data);
    }
  }

  // Realign the current application window when it shifts out of sync
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

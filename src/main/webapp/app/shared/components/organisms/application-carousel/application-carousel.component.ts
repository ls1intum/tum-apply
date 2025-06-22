import { ChangeDetectionStrategy, Component, HostListener, computed, effect, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';

import { ApplicationCardComponent } from '../../molecules/application-card/application-card.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';
import { ApplicationEvaluationDetailDTO } from '../../../../generated/model/applicationEvaluationDetailDTO'; // Constants defining the default visible slots and application window size

// Constants defining the default visible slots and application window size
const VISIBLE_DESKTOP = 3;

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
  totalRecords = input(0); // Total number of applications
  currentIndex = input(0); // Global index of currently selected application
  windowIndex = input(0); // Local index in current application window
  applications = input<ApplicationEvaluationDetailDTO[]>([]);
  windowSize = input.required<number>();

  cardsVisible = signal(VISIBLE_DESKTOP); // Number of visible cards (responsive)

  next = output();
  prev = output();

  isStart = computed(() => {
    return this.currentIndex() === 0;
  });

  isEnd = computed(() => {
    return this.currentIndex() === this.totalRecords() - 1 || this.totalRecords() === 0;
  });

  // Compute the list of applications to display (always fills visible slots with null)
  readonly visibleApps = computed(() => {
    const size = this.cardsVisible();
    const half = Math.floor(size / 2);
    const result: (ApplicationEvaluationDetailDTO | undefined)[] = [];

    for (let offset = -half; offset <= half; offset++) {
      const idx = this.windowIndex() + offset;
      if (idx < 0 || idx >= this.windowSize()) {
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
  }

  // Listen to arrow keys for navigation
  @HostListener('document:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.loadNext();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.loadPrev();
        break;
    }
  }

  loadNext(): void {
    this.next.emit();
  }

  loadPrev(): void {
    this.prev.emit();
  }
}

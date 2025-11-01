import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { ApplicationCardComponent } from '../../molecules/application-card/application-card.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';
import { BREAKPOINTS } from '../../../constants/breakpoints';

// Constants defining the default visible slots and application carousel size
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
  encapsulation: ViewEncapsulation.None,
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
  carouselIndex = input(0); // Local index in current application carousel
  applications = input<ApplicationEvaluationDetailDTO[]>([]);
  carouselSize = input.required<number>();

  cardsVisible = signal(VISIBLE_DESKTOP); // Number of visible cards (responsive)

  next = output();
  prev = output();

  isStart = computed(() => this.currentIndex() === 0);
  isEnd = computed(() => this.currentIndex() === this.totalRecords() - 1 || this.totalRecords() === 0);

  // Compute the list of applications to display (always fills visible slots with null)
  readonly visibleApplications = computed(() => {
    const size = this.cardsVisible();
    const half = Math.floor(size / 2);
    const result: (ApplicationEvaluationDetailDTO | undefined)[] = [];

    for (let offset = -half; offset <= half; offset++) {
      const index = this.carouselIndex() + offset;
      if (index < 0 || index >= this.carouselSize()) {
        result.push(undefined); // Fill with nulls if out of bounds
      } else {
        result.push(this.applications()[index]);
      }
    }

    return result;
  });

  // Index of the center card, used to determine which card is active/focused
  readonly middle = computed(() => Math.floor(this.cardsVisible() / 2));

  constructor() {
    effect(() => this.updateVisibleCards());
    window.addEventListener('resize', () => this.updateVisibleCards());
  }

  // Dynamically adjust the number of visible cards based on content width
  private updateVisibleCards(): void {
    const contentContainer =
      document.querySelector('.page-container') || document.querySelector('main') || document.querySelector('.content') || document.body;

    const containerWidth = contentContainer?.clientWidth ?? window.innerWidth;

    if (containerWidth < BREAKPOINTS.md) {
      this.cardsVisible.set(1);
    } else if (containerWidth < BREAKPOINTS.smallDesktop) {
      this.cardsVisible.set(2);
    } else if (containerWidth < BREAKPOINTS.xl) {
      this.cardsVisible.set(3);
    } else if (containerWidth < BREAKPOINTS.ultraWide) {
      this.cardsVisible.set(5);
    } else {
      this.cardsVisible.set(6);
    }
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

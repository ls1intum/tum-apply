import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
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

const VISIBLE_DESKTOP = 3;

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
export class ApplicationCarouselComponent implements OnDestroy {
  totalRecords = input(0);
  currentIndex = input(0);
  carouselIndex = input(0);
  applications = input<ApplicationEvaluationDetailDTO[]>([]);
  carouselSize = input.required<number>();
  cardsVisible = signal(VISIBLE_DESKTOP);

  next = output();
  prev = output();

  isStart = computed(() => this.currentIndex() === 0);
  isEnd = computed(() => this.currentIndex() === this.totalRecords() - 1 || this.totalRecords() === 0);

  readonly visibleApplications = computed(() => {
    const size = this.cardsVisible();
    const half = Math.floor(size / 2);
    const result: (ApplicationEvaluationDetailDTO | undefined)[] = [];

    for (let offset = -half; offset <= half; offset++) {
      const index = this.carouselIndex() + offset;
      result.push(this.safeGetApplication(index));
    }
    return result;
  });

  readonly middle = computed(() => Math.floor(this.cardsVisible() / 2));
  private readonly _updateCardsEffect = effect(() => {
    this.updateVisibleCards();
  });

  constructor() {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }
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

  private updateVisibleCards(): void {
    const container = document.querySelector('.page-container') ?? document.querySelector('main') ?? document.querySelector('.content');

    const width = container?.clientWidth ?? window.innerWidth;

    if (width < BREAKPOINTS.md) {
      this.cardsVisible.set(1);
    } else if (width < BREAKPOINTS.smallDesktop) {
      this.cardsVisible.set(2);
    } else if (width < BREAKPOINTS.xl) {
      this.cardsVisible.set(3);
    } else if (width < BREAKPOINTS.ultraWide) {
      this.cardsVisible.set(5);
    } else {
      this.cardsVisible.set(6);
    }
  }

  private readonly resizeHandler = (): void => {
    this.updateVisibleCards();
  };

  /**
   * Safely retrieves an application by index.
   * Prevents out-of-bounds and invalid index access.
   */
  private safeGetApplication(index: number): ApplicationEvaluationDetailDTO | undefined {
    if (!Number.isInteger(index)) return undefined;
    if (index < 0 || index >= this.carouselSize()) return undefined;
    return this.applications()[index];
  }
}

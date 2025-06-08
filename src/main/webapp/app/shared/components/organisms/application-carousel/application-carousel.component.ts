import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ApplicationCardComponent } from '../../molecules/application-card/application-card.component';
import { ApplicationEvaluationOverviewDTO } from '../../../../generated';

/** payload when we need the parent to load more */
export interface Page {
  offset: number;
  limit: number;
}

@Component({
  selector: 'jhi-application-carousel',
  imports: [ApplicationCardComponent, FontAwesomeModule],
  templateUrl: './application-carousel.component.html',
  styleUrls: ['./application-carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationCarouselComponent {
  totalCount = input(0);
  applications = input<ApplicationEvaluationOverviewDTO[] | null>(null);
  startIndex = input(0);
  pageRequest = output<Page>();

  currentIndex = signal(0);
  cardsVisible = signal(3);

  readonly padding = 1;

  constructor(private bp: BreakpointObserver) {
    // switch 3 ↔ 1 on handset
    this.bp.observe([Breakpoints.Handset]).subscribe(r => this.cardsVisible.set(r.matches ? 1 : 3));

    // whenever currentIndex *or* cardsVisible changes, prefetch the  window around it
    effect(() => {
      const cur = this.currentIndex();
      const vis = this.cardsVisible();
      const padding = 1;
      const limit = vis + this.padding * 2;
      const halfVis = Math.floor(vis / 2);

      // compute the clean offset clamped into [0, totalCount - limit]
      let offset = cur - halfVis - padding;
      offset = Math.max(0, Math.min(offset, this.totalCount() - limit));

      this.pageRequest.emit({ offset, limit });
    });
  }

  next() {
    if (this.currentIndex() < this.totalCount() - 1) {
      this.currentIndex.update(i => i + 1);
    }
  }

  prev() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
    }
  }

  /** just slice directly from applications[] once it’s been pre-loaded */
  readonly visibleApps = computed(() => {
    const apps = this.applications() ?? [];
    const start = this.startIndex();
    const cur = this.currentIndex();
    const vis = this.cardsVisible();
    const padding = 1;
    const windowSize = vis + padding * 2;
    const halfVis = Math.floor(vis / 2);
    const globalStart = Math.max(0, Math.min(cur - halfVis - padding, this.totalCount() - windowSize));

    // now slice out the next windowSize items
    return apps.slice(globalStart - start, globalStart - start + windowSize);
  });

  /** only the exact center slot is “active” */
  isDisabled(slot: number): boolean {
    const center = Math.floor(this.cardsVisible() / 2);
    return slot !== center;
  }
}

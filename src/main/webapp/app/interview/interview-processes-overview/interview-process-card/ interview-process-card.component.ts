import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TranslateModule } from '@ngx-translate/core';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { TranslateDirective } from 'app/shared/language';

interface StatItem {
  key: string;
  count: number;
  label: string;
  colorClass: string;
}

@Component({
  selector: 'jhi-interview-process-card',
  imports: [CommonModule, CardModule, TranslateModule, TranslateDirective],
  templateUrl: './interview-process-card.component.html',
})
export class InterviewProcessCardComponent {
  process = input.required<InterviewOverviewDTO>();
  cardClick = output<string>();

  /**
   * Stats configuration array - avoids repetitive HTML
   */
  stats = computed<StatItem[]>(() => {
    const process = this.process();
    return [
      {
        key: 'completed',
        count: process.completedCount,
        label: 'interview.overview.stats.completed',
        colorClass: 'bg-[var(--p-primary-400)]',
      },
      {
        key: 'scheduled',
        count: process.scheduledCount,
        label: 'interview.overview.stats.scheduled',
        colorClass: 'bg-[var(--p-primary-300)]',
      },
      {
        key: 'invited',
        count: process.invitedCount,
        label: 'interview.overview.stats.invited',
        colorClass: 'bg-[var(--p-primary-200)]',
      },
      {
        key: 'uncontacted',
        count: process.uncontactedCount,
        label: 'interview.overview.stats.uncontacted',
        colorClass: 'bg-[var(--p-primary-100)]',
      },
    ];
  });

  calculateWidth(count: number): number {
    const process = this.process();
    if (process.totalInterviews === 0) return 0;
    return (count / process.totalInterviews) * 100;
  }

  onCardClick(): void {
    this.cardClick.emit(this.process().jobId);
  }
}

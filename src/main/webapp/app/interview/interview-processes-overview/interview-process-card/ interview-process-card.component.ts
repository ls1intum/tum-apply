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
  widthPercent: number;
}

@Component({
  standalone: true,
  selector: 'jhi-interview-process-card',
  imports: [CommonModule, CardModule, TranslateModule, TranslateDirective],
  templateUrl: './interview-process-card.component.html',
})
export class InterviewProcessCardComponent {
  process = input.required<InterviewOverviewDTO>();
  cardClick = output<string>();

  /**
   * Stats with calculated width percentages
   */
  stats = computed<StatItem[]>(() => {
    const process = this.process();
    const total = process.totalInterviews;

    const calculateWidth = (count: number): number => {
      return total === 0 ? 0 : (count / total) * 100;
    };

    return [
      {
        key: 'completed',
        count: process.completedCount,
        label: 'interview.overview.stats.completed',
        colorClass: 'bg-[var(--p-primary-400)]',
        widthPercent: calculateWidth(process.completedCount),
      },
      {
        key: 'scheduled',
        count: process.scheduledCount,
        label: 'interview.overview.stats.scheduled',
        colorClass: 'bg-[var(--p-primary-300)]',
        widthPercent: calculateWidth(process.scheduledCount),
      },
      {
        key: 'invited',
        count: process.invitedCount,
        label: 'interview.overview.stats.invited',
        colorClass: 'bg-[var(--p-primary-200)]',
        widthPercent: calculateWidth(process.invitedCount),
      },
      {
        key: 'uncontacted',
        count: process.uncontactedCount,
        label: 'interview.overview.stats.uncontacted',
        colorClass: 'bg-[var(--p-primary-100)]',
        widthPercent: calculateWidth(process.uncontactedCount),
      },
    ];
  });

  onCardClick(): void {
    this.cardClick.emit(this.process().jobId);
  }
}

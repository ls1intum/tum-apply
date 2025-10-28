import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TranslateModule } from '@ngx-translate/core';
import { InterviewOverviewDTO} from "app/generated/model/interviewOverviewDTO";
import {TranslateDirective} from "app/shared/language";

@Component({
  selector: 'jhi-interview-process-card',
  standalone: true,
  imports: [CommonModule, CardModule, TranslateModule, TranslateDirective],
  templateUrl: './interview-process-card.component.html',
})
export class InterviewProcessCardComponent {
  process = input.required<InterviewOverviewDTO>();
  cardClick = output<string>();

  calculateWidth(count: number): number {
    const proc = this.process();
    if (proc.totalInterviews === 0) return 0;
    return (count / proc.totalInterviews) * 100;
  }

  onCardClick(): void {
    this.cardClick.emit(this.process().jobId);
  }
}

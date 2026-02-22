import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { TranslateDirective } from 'app/shared/language';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';

type ProcessStatus = 'ACTIVE' | 'CLOSED' | 'NEW';

@Component({
  standalone: true,
  selector: 'jhi-interview-process-card',
  imports: [CommonModule, TranslateModule, TranslateDirective, FontAwesomeModule, InfoBoxComponent, TagComponent],
  templateUrl: './interview-process-card.component.html',
})
export class InterviewProcessCardComponent {
  process = input.required<InterviewOverviewDTO>();
  cardClick = output<string>();

  /**
   * Computed status based on the job's state
   */
  processStatus = computed<ProcessStatus>(() => {
    return this.process().isClosed ? 'CLOSED' : 'ACTIVE';
  });

  totalSlots = computed<number>(() => {
    return this.process().totalSlots ?? 0;
  });

  onCardClick(): void {
    this.cardClick.emit(this.process().jobId);
  }
}

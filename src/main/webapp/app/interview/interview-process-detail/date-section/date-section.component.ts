import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { DateHeaderComponent } from '../date-header/date-header.component';
import { SlotCardComponent } from '../slot-card/slot-card.component';

@Component({
  selector: 'jhi-collapsible-date-section',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DateHeaderComponent,
    SlotCardComponent,
  ],
  templateUrl: './date-section.component.html',
})
export class DateSectionComponent {
  date = input.required<Date>();
  slots = input.required<InterviewSlotDTO[]>();
  defaultExpanded = input(false);

  expanded = signal(this.defaultExpanded());

  toggleExpanded(): void {
    this.expanded.set(!this.expanded());
  }
}

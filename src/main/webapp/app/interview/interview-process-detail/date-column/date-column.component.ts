import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { SlotCardComponent} from "app/interview/interview-process-detail/slot-mini-card/slot-card.component";

@Component({
  selector: 'jhi-date-column',
  standalone: true,
  imports: [CommonModule, ButtonComponent, SlotCardComponent],
  templateUrl: './date-column.component.html',
})
export class DateColumnComponent {
  date = input.required<Date>();
  slots = input.required<InterviewSlotDTO[]>();

  private readonly MAX_VISIBLE_SLOTS = 3;

  showAll = signal(false);

  weekday = () => {
    return this.date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  day = () => {
    return this.date().toLocaleDateString('en-US', { day: '2-digit' });
  };

  visibleSlots = () => {
    const allSlots = this.slots();
    if (this.showAll() || allSlots.length <= this.MAX_VISIBLE_SLOTS) {
      return allSlots;
    }
    return allSlots.slice(0, this.MAX_VISIBLE_SLOTS);
  };

  remainingCount = () => {
    const total = this.slots().length;
    return Math.max(0, total - this.MAX_VISIBLE_SLOTS);
  };

  toggleShowAll(): void {
    this.showAll.set(!this.showAll());
  }
}

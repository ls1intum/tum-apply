import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-slot-mini-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './slot-card.component.html',
})
export class SlotCardComponent {
  slot = input.required<InterviewSlotDTO>();

  private readonly TIMEZONE = 'Europe/Berlin';

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.TIMEZONE,
    });
  }

  timeRange = () => {
    const start = this.formatTime(this.slot().startDateTime!);
    const end = this.formatTime(this.slot().endDateTime!);
    return `${start} - ${end}`;
  };

  isVirtual = () => {
    return this.slot().location === 'virtual';
  };

  isBooked = () => {
    return this.slot().isBooked ?? false;
  };
}

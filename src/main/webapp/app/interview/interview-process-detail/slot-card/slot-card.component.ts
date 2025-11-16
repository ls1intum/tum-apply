import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';

@Component({
  selector: 'jhi-slot-card',
  standalone: true,
  imports: [CommonModule, CardModule, ChipModule],
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

  duration = () => {
    const start = new Date(this.slot().startDateTime!).getTime();
    const end = new Date(this.slot().endDateTime!).getTime();
    return Math.round((end - start) / 60000);
  };

  isVirtual = () => {
    return this.slot().location === 'virtual';
  };
}

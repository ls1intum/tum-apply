import { Component, computed, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';

@Component({
  selector: 'jhi-selectable-slot-card',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './selectable-slot-card.component.html',
})
export class SelectableSlotCardComponent {
  // Inputs
  slot = input.required<InterviewSlotDTO>();
  selected = input<boolean>(false);

  // Outputs
  slotSelected = output<InterviewSlotDTO>();

  // Computed
  timeRange = computed(() => {
    const start = this.formatTime(this.slot().startDateTime);
    const end = this.formatTime(this.slot().endDateTime);
    return `${start} - ${end}`;
  });

  duration = computed(() => {
    const start = new Date(this.slot().startDateTime ?? '');
    const end = new Date(this.slot().endDateTime ?? '');
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${mins} min`;
  });

  // Methods
  onSelect(): void {
    this.slotSelected.emit(this.slot());
  }

  private formatTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

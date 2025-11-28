import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';
import { DatePickerModule } from 'primeng/datepicker';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

export interface SlotRange {
  id: string;
  startStr: string;
  endStr: string;
  startTime: Date | null;
  endTime: Date | null;
  type: 'single' | 'range' | 'scheduled';
  duration: number;
  slots: InterviewSlotDTO[];
}

@Component({
  selector: 'jhi-date-slot-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    DividerModule,
    AccordionModule,
    DatePickerModule,
    TooltipModule,
    ButtonComponent,
  ],
  templateUrl: './date-slot-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateSlotCardComponent {
  readonly date = input.required<Date>();
  readonly duration = input<number>(30);
  readonly breakDuration = input<number>(0);
  readonly existingSlots = input<InterviewSlotDTO[]>([]);

  readonly slotsChange = output<InterviewSlotDTO[]>();

  readonly slotRanges = signal<SlotRange[]>([]);
  readonly allSlots = computed(() => this.slotRanges().flatMap(r => r.slots));

  readonly conflictingRangeIds = computed(() => {
    const ranges = this.slotRanges();
    const conflicts = new Set<string>();

    // Flatten all slots with their parent range ID
    const allSlotsWithIds = ranges.flatMap(range =>
      range.slots.map(slot => ({
        rangeId: range.id,
        start: new Date(slot.startDateTime!).getTime(),
        end: new Date(slot.endDateTime!).getTime(),
      })),
    );

    // Check for overlaps
    for (let i = 0; i < allSlotsWithIds.length; i++) {
      for (let j = i + 1; j < allSlotsWithIds.length; j++) {
        const s1 = allSlotsWithIds[i];
        const s2 = allSlotsWithIds[j];

        if (s1.rangeId === s2.rangeId) {
          continue;
        }

        if (s1.start < s2.end && s2.start < s1.end) {
          conflicts.add(s1.rangeId);
          conflicts.add(s2.rangeId);
        }
      }
    }
    return conflicts;
  });

  private lastEmittedSlots: InterviewSlotDTO[] | null = null;

  constructor() {
    effect(() => {
      const newDuration = this.duration() || 30;
      const newBreak = this.breakDuration() || 0;
      untracked(() => {
        this.recalculateAllRanges(newDuration, newBreak);
      });
    });

    effect(() => {
      const slots = this.existingSlots();
      untracked(() => {
        if (this.isSameSlots(slots, this.lastEmittedSlots)) {
          return;
        }
        this.initializeRangesFromSlots(slots);
      });
    });

    effect(() => {
      const slots = this.allSlots();
      untracked(() => {
        this.lastEmittedSlots = slots;
        this.slotsChange.emit(slots);
      });
    });
  }

  addSingleSlot(): void {
    this.slotRanges.update(ranges => [
      ...ranges,
      {
        id: this.generateId(),
        startStr: '',
        endStr: '',
        startTime: null,
        endTime: null,
        type: 'single',
        duration: this.duration() || 30,
        slots: [],
      },
    ]);
  }

  addRange(): void {
    this.slotRanges.update(ranges => [
      ...ranges,
      {
        id: this.generateId(),
        startStr: '',
        endStr: '',
        startTime: null,
        endTime: null,
        type: 'range',
        duration: this.duration() || 30,
        slots: [],
      },
    ]);
  }

  removeRange(index: number): void {
    this.slotRanges.update(ranges => ranges.filter((_, i) => i !== index));
  }

  removeSlot(rangeIndex: number, slotIndex: number): void {
    this.slotRanges.update(ranges => {
      const newRanges = [...ranges];
      const range = { ...newRanges[rangeIndex] };
      range.slots = range.slots.filter((_, i) => i !== slotIndex);
      newRanges[rangeIndex] = range;
      return newRanges;
    });
  }

  onStartInput(index: number, timeString: string): void {
    this.slotRanges.update(ranges => {
      const newRanges = [...ranges];
      const range = { ...newRanges[index] };

      range.startStr = timeString;
      range.startTime = this.parseTime(timeString);

      if (range.startTime) {
        if (range.type === 'single') {
          const duration = this.duration() || 30;
          const endDate = new Date(range.startTime);
          endDate.setMinutes(endDate.getMinutes() + duration);

          range.endTime = endDate;
          range.endStr = this.formatTime(endDate);

          range.slots = [
            {
              startDateTime: range.startTime.toISOString(),
              endDateTime: range.endTime.toISOString(),
              location: 'in-person',
            } as InterviewSlotDTO,
          ];
        } else if (range.type === 'range') {
          this.updateRangeLogic(range);
        }
      } else {
        if (range.type === 'single') {
          range.endTime = null;
          range.endStr = '';
          range.slots = [];
        } else if (range.type === 'range') {
          range.slots = [];
        }
      }

      newRanges[index] = range;
      return newRanges;
    });
  }

  onEndInput(index: number, timeString: string): void {
    this.slotRanges.update(ranges => {
      const newRanges = [...ranges];
      const range = { ...newRanges[index] };

      range.endStr = timeString;
      range.endTime = this.parseTime(timeString);

      if (range.type === 'range') {
        this.updateRangeLogic(range);
      }

      newRanges[index] = range;
      return newRanges;
    });
  }

  /**
   * Initializes slot ranges from a list of existing slots.
   * Distinguishes between 'scheduled' (persisted) slots and 'single' (draft) slots based on the presence of an ID.
   */
  private initializeRangesFromSlots(slots: InterviewSlotDTO[]): void {
    const ranges = slots.map(slot => {
      const start = new Date(slot.startDateTime!);
      const end = new Date(slot.endDateTime!);
      // If slot has an ID, it's scheduled (persisted). If not, it's a draft (copied).
      const type = slot.id ? 'scheduled' : 'single';

      return {
        id: this.generateId(),
        startStr: this.formatTime(start),
        endStr: this.formatTime(end),
        startTime: start,
        endTime: end,
        type,
        duration: (end.getTime() - start.getTime()) / 60000,
        slots: [slot],
      } as SlotRange;
    });
    this.slotRanges.set(ranges);
  }

  /**
   * Updates the start and end times of a range and regenerates slots.
   * Ensures that the start and end times are on the correct date.
   */
  private updateRangeLogic(range: SlotRange): void {
    if (range.startTime && range.endTime) {
      const baseDate = new Date(this.date());

      const s = new Date(baseDate);
      s.setHours(range.startTime.getHours(), range.startTime.getMinutes(), 0, 0);
      range.startTime = s;

      const e = new Date(baseDate);
      e.setHours(range.endTime.getHours(), range.endTime.getMinutes(), 0, 0);
      range.endTime = e;

      this.generateRangeSlots(range);
    } else {
      range.slots = [];
    }
  }

  /**
   * Recalculates all slot ranges when the global duration or break duration changes.
   * Skips 'scheduled' slots as they are immutable.
   */
  private recalculateAllRanges(duration: number, breakDuration: number): void {
    this.slotRanges.update(ranges => {
      return ranges.map(range => {
        if (range.type === 'scheduled') {
          return range;
        }

        const newRange = { ...range, duration };

        if (newRange.type === 'single' && newRange.startTime) {
          const endDate = new Date(newRange.startTime);
          endDate.setMinutes(endDate.getMinutes() + duration);
          newRange.endTime = endDate;
          newRange.endStr = this.formatTime(endDate);

          newRange.slots = [
            {
              startDateTime: newRange.startTime.toISOString(),
              endDateTime: newRange.endTime.toISOString(),
              location: 'in-person',
            } as InterviewSlotDTO,
          ];
        } else if (newRange.type === 'range') {
          this.generateRangeSlots(newRange, duration, breakDuration);
        }
        return newRange;
      });
    });
  }

  /**
   * Generates individual slots within a time range.
   * Takes into account the slot duration and break duration.
   * Includes a safeguard to prevent infinite loops.
   */
  private generateRangeSlots(range: SlotRange, overrideDuration?: number, overrideBreak?: number): void {
    if (!range.startTime || !range.endTime) {
      range.slots = [];
      return;
    }

    if (range.startTime.getTime() >= range.endTime.getTime()) {
      range.slots = [];
      return;
    }

    const duration = overrideDuration ?? (this.duration() || 30);
    const breakDur = overrideBreak ?? (this.breakDuration() || 0);

    const slots: InterviewSlotDTO[] = [];
    let current = new Date(range.startTime);
    let safeGuard = 0;

    while (safeGuard < 200) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      if (slotEnd.getTime() > range.endTime.getTime()) {
        break;
      }

      slots.push({
        startDateTime: current.toISOString(),
        endDateTime: slotEnd.toISOString(),
        location: 'in-person',
      } as InterviewSlotDTO);

      current = new Date(slotEnd);
      current.setMinutes(current.getMinutes() + breakDur);

      if (current.getTime() >= range.endTime.getTime()) {
        break;
      }
      safeGuard++;
    }

    range.slots = slots;
  }

  private parseTime(timeStr: string): Date | null {
    if (!timeStr) {
      return null;
    }
    const parts = timeStr.split(':');
    if (parts.length !== 2) {
      return null;
    }
    const [hours, minutes] = parts.map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return null;
    }

    const date = new Date(this.date());
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  /**
   * Checks if two arrays of slots are identical.
   * Used to prevent infinite loops when updating the parent component.
   */
  private isSameSlots(a: InterviewSlotDTO[], b: InterviewSlotDTO[] | null): boolean {
    if (!b) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

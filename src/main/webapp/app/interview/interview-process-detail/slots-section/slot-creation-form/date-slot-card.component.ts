import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
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
  location: string;
  slots: InterviewSlotDTO[];
}

@Component({
  selector: 'jhi-date-slot-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    DividerModule,
    AccordionModule,
    DatePickerModule,
    CheckboxModule,
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

  // Internal shared location state
  readonly useSameLocation = signal(false);
  readonly sharedLocation = signal('');

  readonly isSharedLocationVirtual = computed(() => this.isVirtualLocation(this.sharedLocation()));

  readonly conflictingRangeIds = computed(() => {
    const ranges = this.slotRanges();
    const conflicts = new Set<string>();

    const allSlotsWithIds = ranges.flatMap(range =>
      range.slots.map(slot => ({
        rangeId: range.id,
        start: new Date(slot.startDateTime!).getTime(),
        end: new Date(slot.endDateTime!).getTime(),
      })),
    );

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

    // Update all slots when shared location changes
    effect(() => {
      const location = this.sharedLocation();
      const useShared = this.useSameLocation();
      untracked(() => {
        if (useShared) {
          this.applySharedLocation(location);
        }
      });
    });
  }

  isVirtualLocation(location: string): boolean {
    if (!location) return false;
    const trimmed = location.trim().toLowerCase();
    return (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('zoom.') ||
      trimmed.includes('meet.google') ||
      trimmed.includes('teams.microsoft') ||
      trimmed.includes('webex.')
    );
  }

  getLocationType(location: string): 'in-person' | 'virtual' {
    return this.isVirtualLocation(location) ? 'virtual' : 'in-person';
  }

  onSharedLocationChange(location: string): void {
    this.sharedLocation.set(location);
  }

  onUseSameLocationChange(checked: boolean): void {
    this.useSameLocation.set(checked);
    if (checked && this.sharedLocation()) {
      this.applySharedLocation(this.sharedLocation());
    }
  }

  addSingleSlot(): void {
    // Always use sharedLocation as prefill for new slots
    const location = this.sharedLocation();
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
        location,
        slots: [],
      },
    ]);
  }

  addRange(): void {
    // Always use sharedLocation as prefill for new ranges
    const location = this.sharedLocation();
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
        location,
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

      const location = this.useSameLocation() ? this.sharedLocation() : range.location;

      if (range.startTime) {
        if (range.type === 'single') {
          const duration = this.duration() || 30;
          const endDate = new Date(range.startTime);
          endDate.setMinutes(endDate.getMinutes() + duration);

          range.endTime = endDate;
          range.endStr = this.formatTime(endDate);

          range.slots = [this.createSlotDTO(range.startTime, range.endTime, location)];
        } else if (range.type === 'range') {
          this.updateRangeLogic(range, location);
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
        const location = this.useSameLocation() ? this.sharedLocation() : range.location;
        this.updateRangeLogic(range, location);
      }

      newRanges[index] = range;
      return newRanges;
    });
  }

  onLocationInput(index: number, location: string): void {
    this.slotRanges.update(ranges => {
      const newRanges = [...ranges];
      const range = { ...newRanges[index] };

      range.location = location;

      if (range.type === 'single' && range.startTime && range.endTime) {
        range.slots = [this.createSlotDTO(range.startTime, range.endTime, location)];
      } else if (range.type === 'range' && range.startTime && range.endTime) {
        this.generateRangeSlots(range, undefined, undefined, location);
      }

      newRanges[index] = range;
      return newRanges;
    });
  }

  private applySharedLocation(location: string): void {
    this.slotRanges.update(ranges => {
      return ranges.map(range => {
        if (range.type === 'scheduled') {
          return range;
        }

        const newRange = { ...range, location };

        if (newRange.type === 'single' && newRange.startTime && newRange.endTime) {
          newRange.slots = [this.createSlotDTO(newRange.startTime, newRange.endTime, location)];
        } else if (newRange.type === 'range' && newRange.startTime && newRange.endTime) {
          this.generateRangeSlots(newRange, undefined, undefined, location);
        }

        return newRange;
      });
    });
  }

  private createSlotDTO(start: Date, end: Date, location: string): InterviewSlotDTO {
    const locationType = this.getLocationType(location);
    return {
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      location: locationType,
      streamLink: locationType === 'virtual' ? location : undefined,
    } as InterviewSlotDTO;
  }

  private initializeRangesFromSlots(slots: InterviewSlotDTO[]): void {
    const ranges = slots.map(slot => {
      const start = new Date(slot.startDateTime!);
      const end = new Date(slot.endDateTime!);
      const type = slot.id ? 'scheduled' : 'single';
      const location = slot.location === 'virtual' && slot.streamLink ? slot.streamLink : '';

      return {
        id: this.generateId(),
        startStr: this.formatTime(start),
        endStr: this.formatTime(end),
        startTime: start,
        endTime: end,
        type,
        duration: (end.getTime() - start.getTime()) / 60000,
        location,
        slots: [slot],
      } as SlotRange;
    });
    this.slotRanges.set(ranges);
  }

  private updateRangeLogic(range: SlotRange, location?: string): void {
    if (range.startTime && range.endTime) {
      const baseDate = new Date(this.date());

      const s = new Date(baseDate);
      s.setHours(range.startTime.getHours(), range.startTime.getMinutes(), 0, 0);
      range.startTime = s;

      const e = new Date(baseDate);
      e.setHours(range.endTime.getHours(), range.endTime.getMinutes(), 0, 0);
      range.endTime = e;

      this.generateRangeSlots(range, undefined, undefined, location);
    } else {
      range.slots = [];
    }
  }

  private recalculateAllRanges(duration: number, breakDuration: number): void {
    this.slotRanges.update(ranges => {
      return ranges.map(range => {
        if (range.type === 'scheduled') {
          return range;
        }

        const newRange = { ...range, duration };
        const location = this.useSameLocation() ? this.sharedLocation() : newRange.location;

        if (newRange.type === 'single' && newRange.startTime) {
          const endDate = new Date(newRange.startTime);
          endDate.setMinutes(endDate.getMinutes() + duration);
          newRange.endTime = endDate;
          newRange.endStr = this.formatTime(endDate);

          newRange.slots = [this.createSlotDTO(newRange.startTime, newRange.endTime, location)];
        } else if (newRange.type === 'range') {
          this.generateRangeSlots(newRange, duration, breakDuration, location);
        }
        return newRange;
      });
    });
  }

  private generateRangeSlots(range: SlotRange, overrideDuration?: number, overrideBreak?: number, overrideLocation?: string): void {
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
    const location = overrideLocation ?? range.location;

    const slots: InterviewSlotDTO[] = [];
    let current = new Date(range.startTime);
    let safeGuard = 0;

    while (safeGuard < 200) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      if (slotEnd.getTime() > range.endTime.getTime()) {
        break;
      }

      slots.push(this.createSlotDTO(current, slotEnd, location));

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

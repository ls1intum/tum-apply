import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
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
import { ExistingSlotDTO } from 'app/generated/model/existingSlotDTO';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { TimeInputComponent } from 'app/shared/components/atoms/time-input/time-input.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MessageComponent } from 'app/shared/components/atoms/message/message.component';

export interface SlotRange {
  id: string;
  startTimeString: string;
  endTimeString: string;
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
    StringInputComponent,
    TimeInputComponent,
    FontAwesomeModule,
    MessageComponent,
  ],
  templateUrl: './date-slot-card.component.html',
})
export class DateSlotCardComponent {
  readonly date = input.required<Date>();
  readonly duration = input<number>(30);
  readonly breakDuration = input<number>(0);
  readonly existingSlots = input<InterviewSlotDTO[]>([]);
  readonly showApplyAll = input<boolean>(false);
  readonly showValidationErrors = input<boolean>(false);
  // Server-side conflicts passed from parent (key: startDateTime-endDateTime)
  readonly serverConflicts = input<
    Map<string, { type: 'SAME_PROCESS' | 'BOOKED_OTHER_PROCESS'; slot: ExistingSlotDTO; displayTime?: string }>
  >(new Map());

  readonly slotsChange = output<InterviewSlotDTO[]>();
  readonly applyAll = output<boolean>();
  readonly remove = output();

  readonly isCollapsed = signal<boolean>(false);
  readonly slotRanges = signal<SlotRange[]>([]);

  readonly allSlots = computed(() => this.slotRanges().flatMap(range => range.slots));

  readonly conflictingSlotKeys = computed(() => {
    const ranges = this.slotRanges();
    const conflicts = new Map<string, string | null>();

    // 1. Flatten all slots from all ranges into a single array with metadata.
    // Filter out slots that don't have valid start/end times to avoid Invalid Date issues.
    const validSlotsWithIds = ranges.flatMap(range =>
      range.slots
        .map((slot, index) => this.mapSlotToMetadata(slot, range.id, index))
        .filter((item): item is NonNullable<typeof item> => item !== null),
    );

    // 2. Compare every slot with every other slot to find overlaps.
    validSlotsWithIds.forEach((slot1, i) => {
      validSlotsWithIds.slice(i + 1).forEach(slot2 => {
        // 3. Skip comparison if they belong to the same range configuration.
        if (slot1.rangeId === slot2.rangeId) {
          return;
        }

        // 4. Check for time overlap: (StartA < EndB) and (StartB < EndA)
        if (slot1.start < slot2.end && slot2.start < slot1.end) {
          // 5. Mark slot2 as conflicting, and store the display time of slot1
          if (!conflicts.has(slot2.key) || conflicts.get(slot2.key) === null) {
            conflicts.set(slot2.key, slot1.display);
          }
        }
      });
    });
    return conflicts;
  });

  // Combined conflicts: intra-batch (client-side) + server conflicts
  readonly allConflicts = computed(() => {
    const combined = new Map<string, { type: 'BATCH_INTERNAL' | 'SAME_PROCESS' | 'BOOKED_OTHER_PROCESS'; displayTime?: string }>();

    // Add client-side intra-batch conflicts
    for (const [key, displayTime] of this.conflictingSlotKeys().entries()) {
      combined.set(key, { type: 'BATCH_INTERNAL', displayTime: displayTime ?? undefined });
    }

    // Convert server conflicts to rangeId_slotIndex format
    const serverConflictsMap = this.serverConflicts();
    if (serverConflictsMap.size > 0) {
      for (const range of this.slotRanges()) {
        range.slots.forEach((slot, slotIndex) => {
          // Normalize to ISO string to match parent's format
          const serverKey = `${new Date(slot.startDateTime ?? '').toISOString()}-${new Date(slot.endDateTime ?? '').toISOString()}`;
          const conflict = serverConflictsMap.get(serverKey);
          if (conflict) {
            const templateKey = `${range.id}_${slotIndex}`;
            // Server conflicts take priority over batch conflicts
            combined.set(templateKey, { type: conflict.type, displayTime: conflict.displayTime });
          }
        });
      }
    }

    return combined;
  });

  private lastEmittedSlots: InterviewSlotDTO[] | null = null;

  private readonly recalculateEffect = effect(() => {
    const newDuration = this.duration() || 30;
    const newBreak = this.breakDuration() || 0;
    untracked(() => {
      this.recalculateAllRanges(newDuration, newBreak);
    });
  });

  private readonly initializeEffect = effect(() => {
    const slots = this.existingSlots();
    untracked(() => {
      if (this.isSameSlots(slots, this.lastEmittedSlots)) {
        return;
      }
      this.initializeRangesFromSlots(slots);
    });
  });

  private readonly emitSlotsEffect = effect(() => {
    this.emitSlots();
  });

  /**
   * Toggles the collapsed state of the card.
   */
  toggleCollapse(): void {
    this.isCollapsed.update(isCollapsed => !isCollapsed);
  }

  isVirtualLocation(location: string | undefined | null): boolean {
    if (location === undefined || location === null || location === '') return false;
    const trimmed = location.trim().toLowerCase();

    // Regex to detect URLs (http, https, www, or common domains)
    const urlPattern = /^(https?:\/\/)?\S+\.[a-z]{2,}\S*$/i;

    // Specific check for common video conferencing tools even if the URL pattern might miss some edge cases
    const isVideoTool =
      trimmed.includes('zoom.') || trimmed.includes('meet.google') || trimmed.includes('teams.microsoft') || trimmed.includes('webex.');

    return urlPattern.test(trimmed) || isVideoTool;
  }

  getLocationType(location: string): 'in-person' | 'virtual' {
    return this.isVirtualLocation(location) ? 'virtual' : 'in-person';
  }

  /**
   * Adds a new single slot configuration to the list.
   * Initializes with default start time (00:00) and current duration.
   */
  addSingleSlot(): void {
    const location = '';
    const newSlot: SlotRange = {
      id: this.generateId(),
      startTimeString: '',
      endTimeString: '',
      startTime: null,
      endTime: null,
      type: 'single',
      duration: this.duration() || 30,
      location,
      slots: [],
    };
    this.slotRanges.update(ranges => ranges.concat(newSlot));
  }

  /**
   * Adds a new range configuration to the list.
   * Initializes with default start (00:00) and end (00:00) times.
   */
  addRange(): void {
    const location = '';
    const newRange: SlotRange = {
      id: this.generateId(),
      startTimeString: '',
      endTimeString: '',
      startTime: null,
      endTime: null,
      type: 'range',
      duration: this.duration() || 30,
      location,
      slots: [],
    };
    this.slotRanges.update(ranges => ranges.concat(newRange));
  }

  /**
   * Removes a slot range configuration by index.
   * @param index The index of the range to remove.
   */
  removeRange(index: number): void {
    this.slotRanges.update(ranges => ranges.filter((range, i) => i !== index));
  }

  /**
   * Removes a specific generated slot from a range.
   * @param rangeIndex The index of the range containing the slot.
   * @param slotIndex The index of the slot within the range.
   */
  removeSlot(rangeIndex: number, slotIndex: number): void {
    this.slotRanges.update(ranges =>
      ranges.map((range, i) => {
        if (i !== rangeIndex) return range;
        return {
          id: range.id,
          startTimeString: range.startTimeString,
          endTimeString: range.endTimeString,
          startTime: range.startTime,
          endTime: range.endTime,
          type: range.type,
          duration: range.duration,
          location: range.location,
          slots: range.slots.filter((slot, j) => j !== slotIndex),
        };
      }),
    );
  }

  /**
   * Handles input changes for the start time of a range.
   * Updates the start time and recalculates slots or end time based on the type.
   * @param index The index of the range.
   * @param timeString The new start time string (HH:mm).
   */
  onStartInput(index: number, timeString: string | undefined): void {
    const safeTimeString = timeString ?? '';
    this.slotRanges.update(ranges =>
      ranges.map((r, i) => {
        if (i !== index) return r;

        // 1. Create a copy
        const range: SlotRange = {
          id: r.id,
          startTimeString: r.startTimeString,
          endTimeString: r.endTimeString,
          startTime: r.startTime,
          endTime: r.endTime,
          type: r.type,
          duration: r.duration,
          location: r.location,
          slots: r.slots,
        };

        // 2. Update the start time string and parse it into a Date object
        range.startTimeString = safeTimeString;
        range.startTime = this.parseTime(safeTimeString);

        const location = range.location;

        if (range.startTime) {
          if (range.type === 'single') {
            // 3a. Logic for Single Slots:
            // Automatically calculate the end time based on the selected duration.
            const duration = this.duration() || 30;
            const endDate = new Date(range.startTime);
            endDate.setMinutes(endDate.getMinutes() + duration);

            range.endTime = endDate;
            range.endTimeString = this.formatTime(endDate);

            // Create the single slot DTO immediately
            range.slots = [this.createSlotDTO(range.startTime, range.endTime, location)];
          } else if (range.type === 'range') {
            // 3b. Logic for Ranges:
            // The start time defines the beginning of the time window.
            this.updateRangeLogic(range, location);
          }
        } else {
          // 4. Handle Invalid/Empty Input:
          // If the start time is cleared, clear the generated slots and end time (for single slots).
          if (range.type === 'single') {
            range.endTime = null;
            range.endTimeString = '';
            range.slots = [];
          } else if (range.type === 'range') {
            range.slots = [];
          }
        }
        return range;
      }),
    );
  }

  /**
   * Handles input changes for the end time of a range.
   * Updates the end time and recalculates slots if it's a range type.
   * @param index The index of the range.
   * @param timeString The new end time string (HH:mm).
   */
  onEndInput(index: number, timeString: string | undefined): void {
    const safeTimeString = timeString ?? '';
    this.slotRanges.update(ranges =>
      ranges.map((r, i) => {
        if (i !== index) return r;

        const range: SlotRange = {
          id: r.id,
          startTimeString: r.startTimeString,
          endTimeString: r.endTimeString,
          startTime: r.startTime,
          endTime: r.endTime,
          type: r.type,
          duration: r.duration,
          location: r.location,
          slots: r.slots,
        };

        // 2. Update the end time string and parse it
        range.endTimeString = safeTimeString;
        range.endTime = this.parseTime(safeTimeString);

        // 3. If it's a range type, regenerate the slots.
        // Single slots don't have an editable end time (it's derived from duration)
        if (range.type === 'range') {
          const location = range.location;
          this.updateRangeLogic(range, location);
        }

        return range;
      }),
    );
  }

  /**
   * Handles input changes for the location of a range.
   * Updates the location for all generated slots within the range.
   * @param index The index of the range.
   * @param location The new location string.
   */
  onLocationInput(index: number, location: string | undefined): void {
    const safeLocation = location ?? '';
    this.slotRanges.update(ranges =>
      ranges.map((r, i) => {
        if (i !== index) return r;

        const range: SlotRange = {
          id: r.id,
          startTimeString: r.startTimeString,
          endTimeString: r.endTimeString,
          startTime: r.startTime,
          endTime: r.endTime,
          type: r.type,
          duration: r.duration,
          location: r.location,
          slots: r.slots,
        };

        // 2. Update the location string
        range.location = safeLocation;

        // 3. Update the location in the generated slots
        const isVirtual = this.isVirtualLocation(safeLocation);
        range.slots = range.slots.map(slot => ({
          id: slot.id,
          startDateTime: slot.startDateTime,
          endDateTime: slot.endDateTime,
          location: safeLocation,
          streamLink: isVirtual ? safeLocation : undefined,
        }));

        return range;
      }),
    );
  }

  /**
   * Returns the current slot ranges configuration.
   */
  getRanges(): SlotRange[] {
    return this.slotRanges();
  }

  /**
   * Sets the slot ranges for this date, adjusting the time to match this date.
   * Used for "Copy to all" functionality to preserve range structure.
   * @param sourceRanges The ranges to copy from.
   */
  setRanges(sourceRanges: SlotRange[]): void {
    const targetDate = new Date(this.date());
    const newRanges: SlotRange[] = sourceRanges.map(range => {
      // 1. Calculate new start/end times based on the target date
      const newStart = new Date(targetDate);
      if (range.startTime) {
        newStart.setHours(range.startTime.getHours(), range.startTime.getMinutes(), 0, 0);
      }

      const newEnd = new Date(targetDate);
      if (range.endTime) {
        newEnd.setHours(range.endTime.getHours(), range.endTime.getMinutes(), 0, 0);
      }

      // 2. Create the new range object
      const newRange: SlotRange = {
        id: this.generateId(),
        startTimeString: range.startTimeString,
        endTimeString: range.endTimeString,
        startTime: range.startTime ? newStart : null,
        endTime: range.endTime ? newEnd : null,
        type: range.type,
        duration: range.duration,
        location: range.location,
        slots: [],
      };

      // 3. Copy slots from the source range, adjusting the date
      newRange.slots = range.slots.map(slot => {
        const slotStart = new Date(slot.startDateTime ?? '');
        const slotEnd = new Date(slot.endDateTime ?? '');

        const newSlotStart = new Date(targetDate);
        newSlotStart.setHours(slotStart.getHours(), slotStart.getMinutes(), 0, 0);

        const newSlotEnd = new Date(targetDate);
        newSlotEnd.setHours(slotEnd.getHours(), slotEnd.getMinutes(), 0, 0);

        return {
          id: slot.id,
          startDateTime: newSlotStart.toISOString(),
          endDateTime: newSlotEnd.toISOString(),
          location: slot.location,
          streamLink: slot.streamLink,
        };
      });

      return newRange;
    });

    this.slotRanges.set(newRanges);
  }

  /**
   * Emits the current slots to the parent.
   */
  private emitSlots(): void {
    const slots = this.allSlots();
    this.lastEmittedSlots = slots;
    this.slotsChange.emit(slots);
  }

  /**
   * Creates a new InterviewSlotDTO object.
   * @param start The start date and time.
   * @param end The end date and time.
   * @param location The location string.
   * @returns A new InterviewSlotDTO.
   */
  private createSlotDTO(start: Date, end: Date, location: string): InterviewSlotDTO {
    const locationType = this.getLocationType(location);
    return {
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      location,
      streamLink: locationType === 'virtual' ? location : undefined,
    } as InterviewSlotDTO;
  }

  /**
   * Initializes the internal slot ranges from a list of existing slots.
   * Used when editing existing slots or when slots are passed in.
   * @param slots The list of existing InterviewSlotDTOs.
   */
  private initializeRangesFromSlots(slots: InterviewSlotDTO[]): void {
    // Map existing slots (from server or previous state) to internal SlotRange structure
    const ranges = slots.map(slot => {
      const start = new Date(slot.startDateTime ?? '');
      const end = new Date(slot.endDateTime ?? '');

      // If the slot has an ID, it's already saved in the server ('scheduled').
      // Otherwise, it's a newly created 'single' slot.
      const type = slot.id !== undefined ? 'scheduled' : 'single';

      // Extract location
      const location = slot.location ?? '';

      return {
        id: this.generateId(),
        startTimeString: this.formatTime(start),
        endTimeString: this.formatTime(end),
        startTime: start,
        endTime: end,
        type,
        duration: (end.getTime() - start.getTime()) / 60000, // Calculate duration in minutes
        location,
        slots: [slot],
      } as SlotRange;
    });
    this.slotRanges.set(ranges);
  }

  /**
   * Updates the logic for a range type slot.
   * Recalculates start/end times based on the base date and regenerates slots.
   * @param range The slot range to update.
   * @param location Optional location override.
   */
  private updateRangeLogic(range: SlotRange, location?: string): void {
    if (range.startTime && range.endTime) {
      // 1. Ensure the start and end times are on the correct date (this.date())
      const baseDate = new Date(this.date());

      const startDate = new Date(baseDate);
      startDate.setHours(range.startTime.getHours(), range.startTime.getMinutes(), 0, 0);
      range.startTime = startDate;

      const endDate = new Date(baseDate);
      endDate.setHours(range.endTime.getHours(), range.endTime.getMinutes(), 0, 0);
      range.endTime = endDate;

      // 2. Regenerate slots within the new time window
      this.generateRangeSlots(range, undefined, undefined, location);
    } else {
      // 3. If start or end time is missing, clear the slots
      range.slots = [];
    }
  }

  /**
   * Recalculates all slot ranges when global duration or break duration changes.
   * @param duration The new duration in minutes.
   * @param breakDuration The new break duration in minutes.
   */
  private recalculateAllRanges(duration: number, breakDuration: number): void {
    this.slotRanges.update(ranges => {
      return ranges.map(range => {
        // 1. Skip scheduled slots
        // Scheduled slots are immutable regarding global duration changes
        if (range.type === 'scheduled') {
          return range;
        }

        const newRange: SlotRange = {
          id: range.id,
          startTimeString: range.startTimeString,
          endTimeString: range.endTimeString,
          startTime: range.startTime,
          endTime: range.endTime,
          type: range.type,
          duration,
          location: range.location,
          slots: range.slots,
        };
        const location = newRange.location;

        // 2. Update Single Slots
        if (newRange.type === 'single' && newRange.startTime) {
          const endDate = new Date(newRange.startTime);
          endDate.setMinutes(endDate.getMinutes() + duration);
          newRange.endTime = endDate;
          newRange.endTimeString = this.formatTime(endDate);

          newRange.slots = [this.createSlotDTO(newRange.startTime, newRange.endTime, location)];
        }
        // 3. Update Ranges
        else if (newRange.type === 'range') {
          this.generateRangeSlots(newRange, duration, breakDuration, location);
        }
        return newRange;
      });
    });
  }

  /**
   * Generates slots for a range based on start/end time, duration, and break.
   * @param range The slot range to generate slots for.
   * @param overrideDuration Optional duration override.
   * @param overrideBreak Optional break duration override.
   * @param overrideLocation Optional location override.
   */
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
    const breakDurationValue = overrideBreak ?? (this.breakDuration() || 0);
    const location = overrideLocation ?? range.location;

    const slots: InterviewSlotDTO[] = [];
    let current = new Date(range.startTime);
    let safeGuard = 0; // Prevent infinite loops if duration/break logic is faulty

    // Iterate to create slots until exceeding the range's end time
    while (safeGuard < 70) {
      // 1. Calculate the potential end time for the current slot
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // 2. Check if the slot fits within the range
      if (slotEnd.getTime() > range.endTime.getTime()) {
        break;
      }

      // 3. Create the slot DTO and add it to the list
      slots.push(this.createSlotDTO(current, slotEnd, location));

      // 4. Prepare for the next slot
      // Advance current time by adding the slot duration AND the break duration
      current = new Date(slotEnd);
      current.setMinutes(current.getMinutes() + breakDurationValue);

      // 5. Check if the next start time is already out of bounds
      if (current.getTime() >= range.endTime.getTime()) {
        break;
      }
      safeGuard++;
    }

    range.slots = slots;
  }

  /**
   * Parses a time string (HH:mm) into a Date object on the current card's date.
   * @param timeStr The time string to parse.
   * @returns A Date object or null if invalid.
   */
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

  /**
   * Formats a Date object into a time string (HH:mm).
   * @param date The date to format.
   * @returns The formatted time string.
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Generates a random ID for slot ranges.
   * @returns A random string ID.
   */
  private generateId(): string {
    return Math.random().toString(36).slice(2, 11);
  }

  /**
   * Checks if two arrays of slots are identical.
   * Used to prevent unnecessary updates.
   * @param a First array of slots.
   * @param b Second array of slots.
   * @returns True if they are the same, false otherwise.
   */
  private isSameSlots(a: InterviewSlotDTO[], b: InterviewSlotDTO[] | null): boolean {
    if (!b) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }

    const slotsIteratorA = a.values();
    const slotsIteratorB = b.values();

    for (const slotA of slotsIteratorA) {
      const slotB = slotsIteratorB.next().value;
      if (!slotB) {
        return false;
      }

      const areEqual =
        slotA.id === slotB.id &&
        slotA.startDateTime === slotB.startDateTime &&
        slotA.endDateTime === slotB.endDateTime &&
        slotA.location === slotB.location;

      if (!areEqual) {
        return false;
      }
    }
    return true;
  }

  /**
   * Helper method to map a slot to its metadata for conflict detection.
   * Extracts start/end times and formats display string, returning null if invalid.
   * @param slot The slot to map.
   * @param rangeId The ID of the range the slot belongs to.
   * @param index The index of the slot within the range.
   * @returns Metadata object or null if slot is invalid.
   */
  private mapSlotToMetadata(
    slot: InterviewSlotDTO,
    rangeId: string,
    index: number,
  ): { key: string; rangeId: string; start: number; end: number; display: string } | null {
    if ((slot.startDateTime ?? '') === '' || (slot.endDateTime ?? '') === '') {
      return null;
    }
    const start = new Date(slot.startDateTime ?? '');
    const end = new Date(slot.endDateTime ?? '');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }

    return {
      key: `${rangeId}_${index}`,
      rangeId,
      start: start.getTime(),
      end: end.getTime(),
      display: `${this.formatTime(start)} - ${this.formatTime(end)}`,
    };
  }
}

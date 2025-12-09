import { Component, QueryList, ViewChildren, computed, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TooltipModule } from 'primeng/tooltip';
import SharedModule from 'app/shared/shared.module';
import { InterviewResourceApiService } from 'app/generated';
import { ToastService } from 'app/service/toast-service';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { SlotInput } from 'app/generated/model/slotInput';
import { firstValueFrom } from 'rxjs';
import { DateSlotCardComponent } from 'app/interview/interview-process-detail/slots-section/slot-creation-form/date-slot-card.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { NumberInputComponent } from 'app/shared/components/atoms/number-input/number-input.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'jhi-slot-creation-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DialogModule,
    ButtonModule,
    DatePickerModule,
    SelectButtonModule,
    DividerModule,
    ScrollPanelModule,
    SharedModule,
    DateSlotCardComponent,
    ButtonComponent,
    NumberInputComponent,
    TooltipModule,
  ],
  templateUrl: './slot-creation-form.component.html',
})
export class SlotCreationFormComponent {
  @ViewChildren(DateSlotCardComponent) dateCards!: QueryList<DateSlotCardComponent>;

  // Inputs
  readonly visible = model.required<boolean>();
  readonly processId = input.required<string>();

  // Outputs
  readonly visibleChange = output<boolean>();
  readonly success = output<InterviewSlotDTO[]>();

  // State
  readonly isSubmitting = signal(false);

  // Regular property for PrimeNG two-way binding compatibility
  selectedDates: Date[] = [];

  // Signal to track template changes
  readonly selectedDatesSignal = signal<Date[]>([]);

  // Sorted dates for display
  readonly sortedDates = computed(() => [...this.selectedDatesSignal()].sort((a, b) => a.getTime() - b.getTime()));

  readonly duration = signal<number>(30);
  readonly breakDuration = signal<number>(0);

  // Custom Duration/Break State
  readonly customDuration = signal<number | null>(null);
  readonly isCustomDurationMode = signal(false);

  readonly customBreak = signal<number | null>(null);
  readonly isCustomBreakMode = signal(false);

  readonly durationError = signal<string | null>(null);
  readonly breakError = signal<string | null>(null);
  readonly showValidationErrors = signal(false);

  // Map date string to slots
  readonly slotsByDate = signal<Map<string, InterviewSlotDTO[]>>(new Map());

  // Options
  readonly durationOptions = [
    { label: '30min', value: 30 },
    { label: '45min', value: 45 },
    { label: '60min', value: 60 },
    { label: '90min', value: 90 },
  ];

  readonly breakOptions = [
    { label: '0min', value: 0 },
    { label: '5min', value: 5 },
    { label: '10min', value: 10 },
    { label: '15min', value: 15 },
    { label: '30min', value: 30 },
  ];

  readonly minDate = new Date();

  // Dependencies
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly toastService = inject(ToastService);

  /**
   * Selects a predefined duration.
   * If value is -1, switches to custom duration mode.
   * @param value The duration in minutes or -1 for custom.
   */
  selectDuration(value: number): void {
    if (value === -1) {
      this.isCustomDurationMode.set(true);
      if (this.customDuration() === null) {
        this.customDuration.set(this.duration());
      }
    } else {
      this.isCustomDurationMode.set(false);
      this.durationError.set(null); // Clear error on preset switch
      this.duration.set(value);
    }
  }

  /**
   * Updates the duration from the custom input field.
   * @param value The new duration in minutes.
   */
  onCustomDurationInput(value: number | undefined): void {
    const safeValue = value ?? 0;
    this.customDuration.set(safeValue);

    if (safeValue <= 0) {
      this.durationError.set('interview.slots.create.validation.durationPositive');
      // Prevent invalid updates to preserve child component stability
      return;
    }

    this.durationError.set(null);
    this.duration.set(safeValue);
  }

  /**
   * Selects a predefined break duration.
   * If value is -1, switches to custom break mode.
   * @param value The break duration in minutes or -1 for custom.
   */
  selectBreak(value: number): void {
    if (value === -1) {
      this.isCustomBreakMode.set(true);
      if (this.customBreak() === null) {
        this.customBreak.set(this.breakDuration());
      }
    } else {
      this.isCustomBreakMode.set(false);
      this.breakError.set(null); // Clear error on preset switch
      this.breakDuration.set(value);
    }
  }

  /**
   * Updates the break duration from the custom input field.
   * @param value The new break duration in minutes.
   */
  onCustomBreakInput(value: number | undefined): void {
    const safeValue = value ?? 0;
    this.customBreak.set(safeValue);

    if (safeValue < 0) {
      this.breakError.set('interview.slots.create.validation.breakPositive');
    } else {
      this.breakError.set(null);
      this.breakDuration.set(safeValue);
    }
  }

  /**
   * Handles date selection from the calendar.
   * Syncs the regular property with the signal for template reactivity.
   */
  onDateSelect(dates: Date | Date[] | null): void {
    if (!dates) {
      this.selectedDatesSignal.set([]);
      return;
    }

    const currentSelection = Array.isArray(dates) ? dates : [dates];
    const previousSelection = this.selectedDatesSignal();

    // Single date selection toggles the state
    if (currentSelection.length === 1) {
      const clickedDate = currentSelection[0];
      const clickedTime = clickedDate.getTime();

      // Check if date is already selected
      const exists = previousSelection.some(d => d.getTime() === clickedTime);

      let newSelection: Date[];
      if (exists) {
        if (previousSelection.length > 1) {
          newSelection = currentSelection;
        } else {
          newSelection = [];
        }
      } else {
        // Add if new
        newSelection = [...previousSelection, clickedDate];
      }

      // Sort dates chronologically
      newSelection.sort((a, b) => a.getTime() - b.getTime());
      this.selectedDatesSignal.set(newSelection);
    } else {
      // Replace selection for range inputs
      currentSelection.sort((a, b) => a.getTime() - b.getTime());
      this.selectedDatesSignal.set(currentSelection);
    }

    this.selectedDates = this.selectedDatesSignal();
  }

  /**
   * Removes a date from the selected dates list.
   * @param dateToRemove The date to remove.
   */
  removeDate(dateToRemove: Date): void {
    const timeToRemove = dateToRemove.getTime();
    const newSelection = this.selectedDatesSignal().filter(d => d.getTime() !== timeToRemove);
    this.selectedDatesSignal.set(newSelection);
    this.selectedDates = newSelection;
  }

  /**
   * Updates the slots map for a specific date.
   * @param date The date to update.
   * @param slots The new list of slots for that date.
   */
  updateSlotsForDate(date: Date, slots: InterviewSlotDTO[]): void {
    const dateStr = date.toISOString().split('T')[0];
    this.slotsByDate.update(map => {
      const newMap = new Map(map);
      newMap.set(dateStr, slots);
      return newMap;
    });
  }

  /**
   * Copies the slots from the first selected date to all other selected dates.
   */
  copySlotsToAllDays(): void {
    const cards = this.dateCards.toArray();
    if (cards.length < 2) {
      return;
    }

    // 1. Get ranges from first card
    const sourceCard = cards[0];
    const sourceRanges = sourceCard.getRanges();

    if (sourceRanges.length === 0) {
      return;
    }

    // 2. Apply ranges to other cards
    cards.slice(1).forEach(targetCard => {
      targetCard.setRanges(sourceRanges);
    });

    this.toastService.showSuccessKey('interview.slots.create.copySuccess');
  }

  /**
   * Closes the dialog and resets the form state.
   */
  close(): void {
    this.visibleChange.emit(false);
    this.resetState();
  }

  /**
   * Submits the created slots to server.
   * Validate slots before submission.
   */
  async submit(): Promise<void> {
    const allSlots = Array.from(this.slotsByDate().values()).flat();

    if (allSlots.length === 0) {
      this.toastService.showErrorKey('interview.slots.create.error.noSlots');
      return;
    }

    // Validate that all slots have a location
    const hasMissingLocation = allSlots.some(slot => !slot.location || slot.location.trim() === '');
    if (hasMissingLocation) {
      this.showValidationErrors.set(true);
      this.toastService.showErrorKey('interview.slots.create.validation.locationRequired');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const slotsToCreate: SlotInput[] = allSlots.map(slot => {
        const start = new Date(slot.startDateTime ?? '');
        const end = new Date(slot.endDateTime ?? '');
        return {
          date: start.toISOString().split('T')[0],
          startTime: start.toTimeString().slice(0, 5),
          endTime: end.toTimeString().slice(0, 5),
          location: slot.location ?? '',
          streamLink: slot.streamLink,
        };
      });

      const createdSlots = await firstValueFrom(this.interviewService.createSlots(this.processId(), { slots: slotsToCreate }));

      this.toastService.showSuccessKey('interview.slots.create.success');
      this.success.emit(createdSlots);
      this.close();
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.toastService.showErrorKey('interview.slots.create.error.conflict');
      } else {
        this.toastService.showErrorKey('interview.slots.create.error.generic');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Resets the internal state of the form.
   * Clears selected dates, slots, and resets duration/break settings.
   */
  private resetState(): void {
    this.selectedDatesSignal.set([]);
    this.selectedDates = [];
    this.slotsByDate.set(new Map());
    this.isSubmitting.set(false);
    this.showValidationErrors.set(false);
  }
}

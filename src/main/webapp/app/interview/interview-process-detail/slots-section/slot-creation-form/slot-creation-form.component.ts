import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
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
import { DateSlotCardComponent} from "app/interview/interview-process-detail/slots-section/slot-creation-form/date-slot-card.component";
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

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
    TooltipModule,
  ],
  templateUrl: './slot-creation-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotCreationFormComponent {
  // Dependencies
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly toastService = inject(ToastService);

  // Inputs & Outputs
  readonly visible = input.required<boolean>();
  readonly processId = input.required<string>();

  readonly visibleChange = output<boolean>();
  readonly onSuccess = output<InterviewSlotDTO[]>();

  // State
  readonly isSubmitting = signal(false);
  readonly selectedDates = signal<Date[]>([]);
  readonly duration = signal<number>(30);
  readonly breakDuration = signal<number>(0);

  // Map of date string -> slots for that date
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

  /**
   * Handles date selection from the calendar.
   * Ensures that the selected dates are sorted chronologically.
   * Handles null input by resetting the selection.
   */
  onDateSelect(dates: Date | Date[] | null) {
    if (!dates) {
      this.selectedDates.set([]);
      return;
    }
    // p-datepicker with selectionMode="multiple" returns Date[]
    const dateArray = Array.isArray(dates) ? dates : [dates];
    // Sort dates
    dateArray.sort((a, b) => a.getTime() - b.getTime());
    this.selectedDates.set(dateArray);
  }

  updateSlotsForDate(date: Date, slots: InterviewSlotDTO[]) {
    const dateStr = date.toISOString().split('T')[0];
    this.slotsByDate.update(map => {
      const newMap = new Map(map);
      newMap.set(dateStr, slots);
      return newMap;
    });
  }

  /**
   * Copies the slots from the first selected date to all other selected dates.
   * Adjusts the date part of the start and end times to match the target date.
   */
  copySlotsToAllDays() {
    const dates = this.selectedDates();
    if (dates.length < 2) return;

    const firstDateStr = dates[0].toISOString().split('T')[0];
    const firstDateSlots = this.slotsByDate().get(firstDateStr) || [];

    if (firstDateSlots.length === 0) return;

    this.slotsByDate.update(map => {
      const newMap = new Map(map);
      for (let i = 1; i < dates.length; i++) {
        const targetDate = dates[i];
        const targetDateStr = targetDate.toISOString().split('T')[0];

        // Clone slots but update date (recalculate startDateTime/endDateTime)
        const clonedSlots = firstDateSlots.map(slot => {
          const start = new Date(slot.startDateTime!);
          const end = new Date(slot.endDateTime!);

          const newStart = new Date(targetDate);
          newStart.setHours(start.getHours(), start.getMinutes(), 0, 0);

          const newEnd = new Date(targetDate);
          newEnd.setHours(end.getHours(), end.getMinutes(), 0, 0);

          return {
            ...slot,
            startDateTime: newStart.toISOString(),
            endDateTime: newEnd.toISOString(),
          };
        });

        newMap.set(targetDateStr, clonedSlots);
      }
      return newMap;
    });

    this.toastService.showSuccessKey('interview.slots.create.copySuccess');
  }

  close(): void {
    this.visibleChange.emit(false);
    this.resetState();
  }

  async submit(): Promise<void> {
    const allSlots = Array.from(this.slotsByDate().values()).flat();

    if (allSlots.length === 0) {
      this.toastService.showErrorKey('interview.slots.create.noSlots');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const slotsToCreate: SlotInput[] = allSlots.map(slot => {
        const start = new Date(slot.startDateTime!);
        const end = new Date(slot.endDateTime!);
        return {
          date: start.toISOString().split('T')[0],
          startTime: start.toTimeString().slice(0, 5),
          endTime: end.toTimeString().slice(0, 5),
          location: (slot.location as 'in-person' | 'virtual') || 'in-person',
          streamLink: slot.streamLink,
        };
      });

      const createdSlots = await firstValueFrom(
        this.interviewService.createSlots(this.processId(), { slots: slotsToCreate })
      );

      this.toastService.showSuccessKey('interview.slots.create.success');
      this.onSuccess.emit(createdSlots);
      this.close();
    } catch (error) {
      // Error handling
      console.error(error);
      this.toastService.showErrorKey('interview.slots.create.error');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private resetState() {
    this.selectedDates.set([]);
    this.slotsByDate.set(new Map());
    this.isSubmitting.set(false);
  }
}

import { CommonModule } from '@angular/common';
import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import TranslateDirective from 'app/shared/language/translate.directive';
import { formatTimeRange } from 'app/shared/util/date-time.util';

@Component({
  selector: 'jhi-slot-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, TranslateDirective, ButtonComponent, FontAwesomeModule, ConfirmDialog],
  templateUrl: './slot-card.component.html',
  host: {
    '(document:click)': 'handleOutsideClick($event)',
  },
})
export class SlotCardComponent {
  slot = input.required<InterviewSlotDTO>();

  showMenu = signal(false);

  editSlot = output<InterviewSlotDTO>();
  deleteSlot = output<InterviewSlotDTO>();
  assignApplicant = output<InterviewSlotDTO>();

  // Computed values
  timeRange = computed(() => formatTimeRange(this.slot().startDateTime, this.slot().endDateTime));
  isVirtual = computed(() => this.slot().location === 'virtual');
  isBooked = computed(() => this.slot().isBooked ?? false);
  applicantName = computed(() => {
    const interviewee = this.slot().interviewee;
    if (!interviewee) return '';
    return `${interviewee.firstName ?? ''} ${interviewee.lastName ?? ''}`.trim();
  });

  private readonly elementRef = inject(ElementRef);

  handleOutsideClick(event: Event): void {
    if (event.target && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.showMenu.set(false);
    }
  }

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  onEdit(): void {
    this.editSlot.emit(this.slot());
    this.showMenu.set(false);
    // TODO: Open Edit Modal
  }

  onDelete(): void {
    this.deleteSlot.emit(this.slot());
    this.showMenu.set(false);
    // TODO: Open Delete Confirmation
  }

  onAssign(): void {
    this.assignApplicant.emit(this.slot());
    this.showMenu.set(false);
    // TODO: Open Assign Modal
  }
}

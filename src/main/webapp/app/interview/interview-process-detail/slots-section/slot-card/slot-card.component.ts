import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';

@Component({
  selector: 'jhi-slot-card',
  imports: [CommonModule, TranslateDirective, ButtonComponent, FontAwesomeModule],
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

  private readonly TIMEZONE = 'Europe/Berlin';
  private readonly elementRef = inject(ElementRef);

  handleOutsideClick(event: Event): void {
    if (event.target && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.showMenu.set(false);
    }
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.TIMEZONE,
    });
  }

  timeRange = (): string => {
    const start = this.formatTime(this.slot().startDateTime!);
    const end = this.formatTime(this.slot().endDateTime!);
    return `${start} - ${end}`;
  };

  isVirtual = (): boolean => {
    return this.slot().location === 'virtual';
  };

  isBooked = (): boolean => {
    return this.slot().isBooked ?? false;
  };

  applicantName = (): string => {
    // TODO: Will be implemented with Application.scheduledInterviewSlot relationship
    return 'Applicant Name';
  };

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

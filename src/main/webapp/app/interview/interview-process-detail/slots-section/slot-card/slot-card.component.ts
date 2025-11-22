import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import TranslateDirective from 'app/shared/language/translate.directive';

@Component({
  selector: 'jhi-slot-card',
  standalone: true,
  imports: [CommonModule, TranslateDirective],
  templateUrl: './slot-card.component.html',
})
export class SlotCardComponent {
  slot = input.required<InterviewSlotDTO>();

  showMenu = signal(false);

  editSlot = output<InterviewSlotDTO>();
  deleteSlot = output<InterviewSlotDTO>();
  assignApplicant = output<InterviewSlotDTO>();

  private readonly TIMEZONE = 'Europe/Berlin';
  private readonly el = inject(ElementRef);

  /**
   * Closes the dropdown menu when clicking outside the component
   */
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event): void {
    if (event.target && !this.el.nativeElement.contains(event.target as Node)) {
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

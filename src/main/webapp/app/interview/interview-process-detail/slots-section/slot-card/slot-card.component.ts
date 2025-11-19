import { CommonModule } from '@angular/common';
import { Component, HostListener, input, signal, output, ElementRef } from '@angular/core';
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

  constructor(private el: ElementRef) {}

  /**
   * Closes the dropdown menu when clicking outside the component
   */
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
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

  timeRange = () => {
    const start = this.formatTime(this.slot().startDateTime!);
    const end = this.formatTime(this.slot().endDateTime!);
    return `${start} - ${end}`;
  };

  isVirtual = () => {
    return this.slot().location === 'virtual';
  };

  isBooked = () => {
    return this.slot().isBooked ?? false;
  };

  applicantName = () => {
    // TODO: Will be implemented later with Application.scheduledInterviewSlot relationship
    return 'Applicant Name';
  };

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  onEdit(): void {
    this.editSlot.emit(this.slot());
    this.showMenu.set(false);
  }

  onDelete(): void {
    this.deleteSlot.emit(this.slot());
    this.showMenu.set(false);
  }

  onAssign(): void {
    this.assignApplicant.emit(this.slot());
    this.showMenu.set(false);
  }
}

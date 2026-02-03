import { Component, computed, input, output, viewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { JhiMenuItem, MenuComponent } from 'app/shared/components/atoms/menu/menu.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { formatTimeRange } from 'app/shared/util/date-time.util';

@Component({
  selector: 'jhi-slot-card',
  standalone: true,
  imports: [TranslateModule, TranslateDirective, ButtonComponent, FontAwesomeModule, ConfirmDialog, MenuComponent],
  templateUrl: './slot-card.component.html',
})
export class SlotCardComponent {
  slot = input.required<InterviewSlotDTO>();

  editSlot = output<InterviewSlotDTO>();
  deleteSlot = output<InterviewSlotDTO>();
  assignApplicant = output<InterviewSlotDTO>();

  readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog');

  // Computed values
  timeRange = computed(() => formatTimeRange(this.slot().startDateTime, this.slot().endDateTime));
  isVirtual = computed(() => this.slot().location === 'virtual');
  isBooked = computed(() => this.slot().isBooked ?? false);
  applicantName = computed(() => {
    const interviewee = this.slot().interviewee;
    if (!interviewee) return '';
    return `${interviewee.firstName ?? ''} ${interviewee.lastName ?? ''}`.trim();
  });
  isPast = computed(() => {
    const dateTime = this.slot().startDateTime;
    if (!dateTime) return false;
    return new Date(dateTime) < new Date();
  });

  // Menu items for kebab menu
  readonly menuItems = computed<JhiMenuItem[]>(() => [
    // TODO: Uncomment when edit functionality is implemented
    // { label: 'button.edit', icon: 'pencil', command: () => this.onEdit() },
    { label: 'button.delete', icon: 'trash', command: () => this.deleteDialog().confirm(), severity: 'danger' },
  ]);

  onEdit(): void {
    this.editSlot.emit(this.slot());
    // TODO: Open Edit Modal
  }

  onDelete(): void {
    this.deleteSlot.emit(this.slot());
  }

  onAssign(): void {
    this.assignApplicant.emit(this.slot());
  }
}

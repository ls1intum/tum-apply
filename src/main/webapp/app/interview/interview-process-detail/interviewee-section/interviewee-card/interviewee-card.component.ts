import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-interviewee-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, TranslateDirective, ButtonComponent, FontAwesomeModule],
  templateUrl: './interviewee-card.component.html',
})
export class IntervieweeCardComponent {
  interviewee = input.required<IntervieweeDTO>();

  protected readonly IntervieweeState = {
    UNCONTACTED: 'UNCONTACTED',
    INVITED: 'INVITED',
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
  } as const;

  private readonly translateService = inject(TranslateService);

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString(this.translateService.currentLang, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString(this.translateService.currentLang, { hour: '2-digit', minute: '2-digit' });
  }

  get timeRange(): string {
    const slot = this.interviewee().scheduledSlot;
    if (!slot) return '';
    const start = this.formatTime(slot.startDateTime);
    const end = this.formatTime(slot.endDateTime);
    return `${start} - ${end}`;
  }

  get location(): string {
    const slot = this.interviewee().scheduledSlot;
    if (!slot) return '';
    return slot.location === 'virtual' ? 'virtual' : 'in-person';
  }

  get isVirtual(): boolean {
    return this.interviewee().scheduledSlot?.location === 'virtual';
  }
}

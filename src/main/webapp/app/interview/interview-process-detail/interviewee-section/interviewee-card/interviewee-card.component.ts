import { Component, computed, inject, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';

/**
 * Card component displaying an interviewee's status and scheduled slot details.
 * Shows different UI based on state: UNCONTACTED, INVITED, SCHEDULED, COMPLETED.
 */
@Component({
  selector: 'jhi-interviewee-card',
  standalone: true,
  imports: [TranslateModule, TranslateDirective, ButtonComponent, FontAwesomeModule],
  templateUrl: './interviewee-card.component.html',
})
export class IntervieweeCardComponent {
  // Inputs
  interviewee = input.required<IntervieweeDTO>();

  // Computed
  timeRange = computed(() => {
    const slot = this.interviewee().scheduledSlot;
    if (!slot) return '';
    return `${this.formatTime(slot.startDateTime)} - ${this.formatTime(slot.endDateTime)}`;
  });

  location = computed(() => this.interviewee().scheduledSlot?.location ?? '');
  isVirtual = computed(() => this.interviewee().scheduledSlot?.location === 'virtual');

  // Constants
  protected readonly IntervieweeState = {
    UNCONTACTED: 'UNCONTACTED',
    INVITED: 'INVITED',
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
  } as const;

  // Services
  private readonly translateService = inject(TranslateService);

  // Formats date to localized string (e.g., "27. Dezember 2025")
  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString(this.getLocale(), { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Formats time to localized string (e.g., "14:30")
  formatTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString(this.getLocale(), { hour: '2-digit', minute: '2-digit' });
  }

  private getLocale(): string {
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  }
}

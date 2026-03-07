import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UpcomingInterviewDTO } from 'app/generated/model/upcomingInterviewDTO';
import LocalizedDatePipe from 'app/shared/pipes/localized-date.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import dayjs from 'dayjs/esm';

const AVATAR_COLORS = ['bg-[var(--p-accent-200)]', 'bg-[var(--p-info-200)]', 'bg-[var(--p-warn-200)]', 'bg-[var(--p-danger-200)]'];

@Component({
  selector: 'jhi-upcoming-interview-card',
  standalone: true,
  imports: [LocalizedDatePipe, RouterLink, FontAwesomeModule, NgClass],
  templateUrl: './upcoming-interview-card.component.html',
})
export class UpcomingInterviewCardComponent {
  interview = input.required<UpcomingInterviewDTO>();
  index = input<number>(0);

  initials = computed(() => {
    const name = this.interview().intervieweeName ?? '';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  });

  avatarColor = computed(() => AVATAR_COLORS[this.index() % AVATAR_COLORS.length]);

  formattedTimeRange = computed(() => {
    const i = this.interview();
    return `${dayjs(i.startDateTime).format('HH:mm')} - ${dayjs(i.endDateTime).format('HH:mm')}`;
  });
}

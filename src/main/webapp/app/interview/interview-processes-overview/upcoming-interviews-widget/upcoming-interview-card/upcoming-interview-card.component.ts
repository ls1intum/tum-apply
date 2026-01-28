import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpcomingInterviewDTO } from 'app/generated/model/upcomingInterviewDTO';
import LocalizedDatePipe from 'app/shared/pipes/localized-date.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import dayjs from 'dayjs/esm';

@Component({
    selector: 'jhi-upcoming-interview-card',
    standalone: true,
    imports: [LocalizedDatePipe, RouterLink, FontAwesomeModule],
    templateUrl: './upcoming-interview-card.component.html',
})
export class UpcomingInterviewCardComponent {
    interview = input.required<UpcomingInterviewDTO>();

    formattedTimeRange = computed(() => {
        const i = this.interview();
        return `${dayjs(i.startDateTime).format('HH:mm')} - ${dayjs(i.endDateTime).format('HH:mm')}`;
    });
}

import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-job-card',
  templateUrl: './job-card.component.html',
  styleUrls: ['./job-card.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, CardModule, ButtonComponent],
})
export class JobCardComponent {
  jobTitle = input<string>('');
  fieldOfStudies = input<string>('');
  location = input<string>('');
  professor = input<string>('');
  workload = input<string>('');
  startDate = input<string>('');
  timestamp = input<string>('');

  onViewDetails(): void {
    alert('View Details clicked!');
  }

  onApply(): void {
    alert('Apply clicked!');
  }

  getRelativeTime(date: string | undefined): string {
    if (date === undefined) {
      return '';
    }
    const now = new Date();
    const past = new Date(date);
    const diffMilliSeconds = now.getTime() - past.getTime();

    const diffDays = Math.floor(diffMilliSeconds / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.round((diffDays / 365) * 2) / 2;

    if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffDays < 21) {
      return diffDays < 14 ? '1 week ago' : '2 weeks ago';
    } else if (diffDays === 21) {
      return '3 weeks ago';
    } else if (diffMonths < 12) {
      return diffMonths <= 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  }
}

import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';

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
  relativeTime = input<string>('');

  onViewDetails(): void {
    alert('View Details clicked!');
  }

  onApply(): void {
    alert('Apply clicked!');
  }
}

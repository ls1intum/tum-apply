import { Component } from '@angular/core';
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
  jobCard = {
    title: 'Deep Learning for Medical Imaging Diagnostics',
    timestamp: '1 month ago',
    fieldOfStudies: 'Informatics',
    location: 'Garching',
    professor: 'Prof. Dr. Krusche',
    workload: '60%',
    startDate: 'Dec 1, 2025',
  };

  onViewDetails(): void {
    alert('View Details clicked!');
  }

  onApply(): void {
    alert('Apply clicked!');
  }
}

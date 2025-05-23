import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { faGraduationCap, faLocationDot, faUser, faClock, faCalendar, faFlaskVial } from '@fortawesome/free-solid-svg-icons';

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
  // FontAwesome icons
  faGraduationCap = faGraduationCap;
  faLocationDot = faLocationDot;
  faUser = faUser;
  faClock = faClock;
  faCalendar = faCalendar;
  faFlaskVial = faFlaskVial;

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

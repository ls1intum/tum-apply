import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobCardListComponent } from '../job-card-list/job-card-list.component';

@Component({
  selector: 'jhi-job-overview-page',
  standalone: true,
  imports: [CommonModule, JobCardListComponent],
  templateUrl: './job-overview-page.component.html',
  styleUrls: ['./job-overview-page.component.scss'],
})
export class JobOverviewPageComponent {}

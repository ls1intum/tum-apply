import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobResourceService } from 'app/generated/api/jobResource.service';
import { JobCardDTO } from 'app/generated';

import { JobCardComponent } from '../job-card/job-card.component';

@Component({
  selector: 'jhi-job-overview-page',
  standalone: true,
  imports: [CommonModule, JobCardComponent],
  templateUrl: './job-overview-page.component.html',
  styleUrls: ['./job-overview-page.component.scss'],
})
export class JobOverviewPageComponent implements OnInit {
  jobCards: JobCardDTO[] = [];

  constructor(private jobService: JobResourceService) {}

  ngOnInit(): void {
    this.jobService.getAvailableJobs().subscribe({
      next: jobs => {
        this.jobCards = jobs;
      },
      error: err => {
        console.error('Failed to load jobs:', err);
      },
    });
  }

  getRelativeTime(date: string | undefined): string {
    if (!date) {
      return '';
    }
    const now = new Date();
    const past = new Date(date);
    const diffMilliSeconds = now.getTime() - past.getTime();

    const diffDays = Math.floor(diffMilliSeconds / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears < 30) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  }

  getWorkload(value: number | null | undefined): string {
    return value != null ? `${value}%` : '—';
  }
}

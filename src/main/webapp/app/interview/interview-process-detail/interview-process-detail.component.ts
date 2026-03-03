import { Component, computed, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import { ToastService } from 'app/service/toast-service';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { IntervieweeSectionComponent } from 'app/interview/interview-process-detail/interviewee-section/interviewee-section.component';

import { SlotsSectionComponent } from './slots-section/slots-section.component';

@Component({
  selector: 'jhi-interview-process-detail',
  standalone: true,
  imports: [TranslateModule, BackButtonComponent, SlotsSectionComponent, IntervieweeSectionComponent],
  templateUrl: './interview-process-detail.component.html',
})
export class InterviewProcessDetailComponent {
  processId = signal<string | null>(null);
  readonly safeProcessId = computed(() => this.processId() ?? '');
  jobId = signal<string | null>(null);
  jobTitle = signal<string | null>(null);
  readonly safeJobTitle = computed(() => this.jobTitle() ?? '');

  // Signal to trigger interviewee section reload
  intervieweeRefreshKey = signal(0);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly titleService = inject(Title);
  private readonly toastService = inject(ToastService);

  private readonly updateTitleEffect = effect(() => {
    const title = this.jobTitle();
    if (title) {
      this.updateTabTitle(title);
    }
  });

  private readonly location = inject(Location);

  constructor() {
    const id = this.route.snapshot.paramMap.get('processId');
    if (id) {
      this.processId.set(id);
      void this.loadProcessDetails(id);
    }
  }

  onSlotAssigned(): void {
    this.intervieweeRefreshKey.update(k => k + 1);
  }

  private updateTabTitle(jobTitle: string): void {
    this.titleService.setTitle(`Interview – ${jobTitle}`);
  }

  private async loadProcessDetails(processId: string): Promise<void> {
    try {
      const process = await firstValueFrom(this.interviewService.getInterviewProcessDetails(processId));

      if (process.jobTitle) {
        this.jobTitle.set(process.jobTitle);
      }
      if (process.jobId) {
        this.jobId.set(process.jobId);
      }
    } catch {
      this.toastService.showErrorKey('interview.detail.error.loadFailed');
    }
  }
}

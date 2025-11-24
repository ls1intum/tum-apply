import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { SlotsSectionComponent } from './slots-section/slots-section.component';

@Component({
  selector: 'jhi-interview-process-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, SlotsSectionComponent],
  templateUrl: './interview-process-detail.component.html',
})
export class InterviewProcessDetailComponent {
  processId = signal<string | null>(null);
  jobTitle = signal<string | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly titleService = inject(Title);
  private readonly toastService = inject(ToastService);

  private readonly updateTitleEffect = effect(() => {
    const title = this.jobTitle();
    if (title) {
      this.updateTabTitle(title);
    }
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('processId');
    if (id) {
      this.processId.set(id);
      void this.loadProcessDetails(id);
    }
  }
  navigateBack(): void {
    this.router.navigate(['/interviews/overview']);
  }
  private updateTabTitle(jobTitle: string): void {
    const translatedTitle = this.translateService.instant('global.routes.interview.detail', { jobTitle });
    this.titleService.setTitle(translatedTitle);
  }

  private async loadProcessDetails(processId: string): Promise<void> {
    try {
      const process = await firstValueFrom(this.interviewService.getInterviewProcessDetails(processId));

      if (process.jobTitle) {
        this.jobTitle.set(process.jobTitle);
      }
    } catch (error) {
      this.toastService.showErrorKey('interview.detail.error.loadFailed');
    }
  }
}

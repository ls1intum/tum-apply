import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { SlotsSectionComponent } from './slots-section/slots-section.component';

@Component({
  selector: 'jhi-interview-process-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonComponent,
    SlotsSectionComponent,
  ],
  templateUrl: './interview-process-detail.component.html',
})
export class InterviewProcessDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewResourceApiService);

  processId = signal<string | null>(null);
  jobTitle = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('processId');
    if (id) {
      this.processId.set(id);
      void this.loadProcessDetails(id);
    }
  }

  private async loadProcessDetails(processId: string): Promise<void> {
    try {
      const process = await firstValueFrom(
        this.interviewService.getInterviewProcessDetails(processId)
      );

      if (process?.jobTitle) {
        this.jobTitle.set(process.jobTitle);
      }
    } catch (error) {
      console.error('Failed to load interview process details', error);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/interviews/overview']);
  }
}

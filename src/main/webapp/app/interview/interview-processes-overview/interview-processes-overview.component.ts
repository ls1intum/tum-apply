import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { InterviewProcessCardComponent } from 'app/interview/interview-processes-overview/interview-process-card/ interview-process-card.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { InterviewService } from '../service/interview.service';

import { CreateInterviewDialogComponent } from './create-interview-dialog/create-interview-dialog.component';

@Component({
  selector: 'jhi-interview-processes-overview',
  standalone: true,
  imports: [CommonModule, TranslateModule, InterviewProcessCardComponent, ButtonComponent],
  providers: [DialogService],
  templateUrl: './interview-processes-overview.component.html',
})
export class InterviewProcessesOverviewComponent implements OnInit, OnDestroy {
  readonly interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<boolean>(false);

  private readonly interviewService = inject(InterviewService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private dialogRef?: DynamicDialogRef;

  ngOnInit(): void {
    void this.loadInterviewProcesses();
  }

  ngOnDestroy(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  openCreateInterviewDialog(): void {
    this.dialogRef = this.dialogService.open(CreateInterviewDialogComponent, {
      modal: true,
      closable: true,
      closeOnEscape: true,
      dismissableMask: false,
    });

    this.dialogRef.onClose.subscribe(result => {
      if (result) {
        void this.loadInterviewProcesses();
      }
    });
  }

  viewDetails(jobId: string): void {
    this.router.navigate(['/interviews', jobId]);
  }

  // ---- Private section ----
  private async loadInterviewProcesses(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);
      const data = await this.interviewService.getInterviewOverview().toPromise();
      this.interviewProcesses.set(data ?? []);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}

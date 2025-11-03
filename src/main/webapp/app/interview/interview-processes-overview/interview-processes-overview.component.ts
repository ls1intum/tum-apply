import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InterviewProcessCardComponent} from "app/interview/interview-processes-overview/interview-process-card/ interview-process-card.component";
import { CreateInterviewDialogComponent } from './create-interview-dialog/create-interview-dialog.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { InterviewService } from '../service/interview.service';

@Component({
  selector: 'jhi-interview-processes-overview',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TranslateDirective,
    InterviewProcessCardComponent,
    ButtonComponent
  ],
  providers: [DialogService],
  templateUrl: './interview-processes-overview.component.html',
})
export class InterviewProcessesOverviewComponent implements OnInit {
  interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

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
      width: '50rem',   // ← rem statt px
      height: '43.75rem', // ← 700px = 43.75rem (700/16)
      modal: true,
      breakpoints: {
        '960px': '90vw',
        '640px': '95vw'
      }
    });

    this.dialogRef.onClose.subscribe((result) => {
      if (result) {
        void this.loadInterviewProcesses();
      }
    });
  }

  viewDetails(jobId: string): void {
    this.router.navigate(['/interviews', jobId]);
  }

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

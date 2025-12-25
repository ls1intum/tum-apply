import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';

import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';
import { InterviewResourceApiService } from 'app/generated';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';

@Component({
  selector: 'jhi-assign-applicant-modal',
  standalone: true,
  imports: [TranslateModule, TranslateDirective, DialogComponent, ProgressSpinnerModule, FontAwesomeModule, ButtonComponent],
  templateUrl: './assign-applicant-modal.component.html',
})
export class AssignApplicantModalComponent {
  // Inputs
  visible = input.required<boolean>();
  slot = input.required<InterviewSlotDTO>();
  processId = input.required<string>();

  // Outputs
  visibleChange = output<boolean>();
  applicantAssigned = output<void>();

  // State signals
  interviewees = signal<IntervieweeDTO[]>([]);
  selectedApplicantId = signal<string | null>(null);
  loading = signal(false);
  assignLoading = signal(false);

  // Injected services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly toastService = inject(ToastService);

  // Computed signals
  canAssign = computed(() => this.selectedApplicantId() !== null && !this.assignLoading());

  // Effect: fetch interviewees when modal opens
  private readonly openEffect = effect(() => {
    if (this.visible()) {
      void this.fetchInterviewees();
    }
  });

  selectApplicant(interviewee: IntervieweeDTO): void {
    if (this.isDisabled(interviewee)) return;

    const applicationId = interviewee.applicationId ?? null;
    this.selectedApplicantId.set(this.selectedApplicantId() === applicationId ? null : applicationId);
  }

  isSelected(interviewee: IntervieweeDTO): boolean {
    return this.selectedApplicantId() === interviewee.applicationId;
  }

  isDisabled(interviewee: IntervieweeDTO): boolean {
    return interviewee.state === 'SCHEDULED';
  }

  async assignApplicant(): Promise<void> {
    const applicationId = this.selectedApplicantId();
    const slotId = this.slot().id;

    if (!applicationId || !slotId) return;

    try {
      this.assignLoading.set(true);
      await firstValueFrom(this.interviewService.assignSlotToInterviewee(slotId, { applicationId }));
      this.toastService.showSuccessKey('interview.assign.success');
      this.applicantAssigned.emit();
      this.closeModal();
    } catch (error) {
      const status = (error as { status?: number })?.status;
      switch (status) {
        case 409:
          this.toastService.showErrorKey('interview.assign.error.alreadyBooked');
          this.applicantAssigned.emit();
          this.closeModal();
          break;
        case 400:
          this.toastService.showErrorKey('interview.assign.error.notInProcess');
          break;
        case 403:
        case 404:
          this.toastService.showErrorKey('interview.assign.error.failed');
          this.applicantAssigned.emit();
          this.closeModal();
          break;
        default:
          this.toastService.showErrorKey('interview.assign.error.failed');
      }
    } finally {
      this.assignLoading.set(false);
    }
  }

  closeModal(): void {
    this.resetState();
    this.visibleChange.emit(false);
  }

  formatTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString([], { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private async fetchInterviewees(): Promise<void> {
    try {
      this.loading.set(true);
      const data = await firstValueFrom(this.interviewService.getIntervieweesByProcessId(this.processId()));
      this.interviewees.set(data);
    } catch {
      this.toastService.showErrorKey('interview.assign.error.loadFailed');
    } finally {
      this.loading.set(false);
    }
  }

  private resetState(): void {
    this.selectedApplicantId.set(null);
    this.interviewees.set([]);
  }
}

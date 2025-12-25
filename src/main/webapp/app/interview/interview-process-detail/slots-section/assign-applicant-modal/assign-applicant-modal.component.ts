import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, TranslateModule, TranslateDirective, DialogComponent, ProgressSpinnerModule, FontAwesomeModule, ButtonComponent],
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
  availableInterviewees = computed(() => this.interviewees().filter(i => i.state !== 'SCHEDULED'));

  canAssign = computed(() => this.selectedApplicantId() !== null && !this.assignLoading());

  // Effect: fetch interviewees when modal opens
  private readonly openEffect = effect(() => {
    if (this.visible()) {
      void this.fetchInterviewees();
    }
  });

  /**
   * Selects or deselects an interviewee for assignment.
   * Disabled interviewees (already scheduled) cannot be selected.
   */
  selectApplicant(interviewee: IntervieweeDTO): void {
    if (this.isDisabled(interviewee)) {
      return;
    }
    const applicationId = interviewee.applicationId ?? null;
    // Toggle selection if same applicant clicked
    if (this.selectedApplicantId() === applicationId) {
      this.selectedApplicantId.set(null);
    } else {
      this.selectedApplicantId.set(applicationId);
    }
  }

  /**
   * Checks if an interviewee is currently selected.
   */
  isSelected(interviewee: IntervieweeDTO): boolean {
    return this.selectedApplicantId() === interviewee.applicationId;
  }

  /**
   * Checks if an interviewee is disabled (already has a scheduled slot).
   */
  isDisabled(interviewee: IntervieweeDTO): boolean {
    return interviewee.state === 'SCHEDULED';
  }

  /**
   * Assigns the selected applicant to the slotserve.
   * Handles success, conflict, and error cases with appropriate toasts.
   */
  async assignApplicant(): Promise<void> {
    const applicationId = this.selectedApplicantId();
    const slotId = this.slot().id;

    if (!applicationId || !slotId) {
      return;
    }

    try {
      this.assignLoading.set(true);
      await firstValueFrom(this.interviewService.assignSlotToInterviewee(slotId, { applicationId }));
      this.toastService.showSuccessKey('interview.assign.success');
      this.applicantAssigned.emit();
      this.closeModal();
    } catch (error: unknown) {
      const httpError = error as { status?: number };
      switch (httpError.status) {
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
          break;
      }
    } finally {
      this.assignLoading.set(false);
    }
  }

  /**
   * Closes the modal and resets all state.
   */
  closeModal(): void {
    this.resetState();
    this.visibleChange.emit(false);
  }

  // Template helper methods
  formatTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString([], { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0).toUpperCase() ?? '';
    const last = lastName?.charAt(0).toUpperCase() ?? '';
    return `${first}${last}`;
  }

  private async fetchInterviewees(): Promise<void> {
    try {
      this.loading.set(true);
      const processId = this.processId();
      const data = await firstValueFrom(this.interviewService.getIntervieweesByProcessId(processId));
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

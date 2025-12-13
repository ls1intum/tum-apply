import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationEvaluationResourceApiService, InterviewResourceApiService } from 'app/generated';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { AddIntervieweesDTO } from 'app/generated/model/addIntervieweesDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { Section } from 'app/shared/components/atoms/section/section';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';

import { IntervieweeCardComponent } from './interviewee-card/interviewee-card.component';

type FilterTab = 'ALL' | 'UNCONTACTED' | 'INVITED' | 'SCHEDULED' | 'COMPLETED';

@Component({
  selector: 'jhi-interviewee-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TranslateDirective,
    DialogModule,
    CheckboxModule,
    ButtonComponent,
    Section,
    IntervieweeCardComponent,
  ],
  templateUrl: './interviewee-section.component.html',
})
export class IntervieweeSectionComponent {
  // Inputs
  processId = input.required<string>();
  jobId = input.required<string>();
  jobTitle = input.required<string>();

  // Section state
  interviewees = signal<IntervieweeDTO[]>([]);
  loadingInterviewees = signal(false);
  activeFilter = signal<FilterTab>('ALL');

  // Modal state
  showAddModal = signal(false);
  applicants = signal<ApplicationEvaluationDetailDTO[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  loadingApplicants = signal(false);
  submitting = signal(false);
  processingAdd = signal(false);

  // Filter tabs with counts
  filterTabs = computed(() => {
    const all = this.interviewees();
    return [
      { key: 'ALL' as FilterTab, count: all.length },
      { key: 'INVITED' as FilterTab, count: all.filter(i => i.state === 'INVITED').length },
      { key: 'SCHEDULED' as FilterTab, count: all.filter(i => i.state === 'SCHEDULED').length },
      { key: 'UNCONTACTED' as FilterTab, count: all.filter(i => i.state === 'UNCONTACTED').length },
      { key: 'COMPLETED' as FilterTab, count: all.filter(i => i.state === 'COMPLETED').length },
    ];
  });

  // Filtered interviewees based on active tab
  filteredInterviewees = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.interviewees();
    return this.interviewees().filter(i => i.state === filter);
  });

  // Applicants not yet added as interviewees (with selection state)
  availableApplicants = computed(() => {
    const existingIds = new Set(this.interviewees().map(i => i.applicationId));
    const selected = this.selectedIds();

    return this.applicants()
      .filter(app => !existingIds.has(app.applicationDetailDTO.applicationId))
      .map(app => ({
        ...app,
        selected: selected.has(app.applicationDetailDTO.applicationId),
      }));
  });

  selectedCount = computed(() => this.selectedIds().size);

  // Services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly applicationService = inject(ApplicationEvaluationResourceApiService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // Effects
  private readonly loadEffect = effect(() => {
    if (this.processId()) {
      this.loadInterviewees();
    }
  });

  private readonly modalOpenEffect = effect(() => {
    if (this.showAddModal() && this.jobTitle()) {
      void this.loadApplicants();
    }
  });

  loadInterviewees(): void {
    // Loads the list of interviewees for the current process.
    const processId = this.processId();
    if (!processId) {
      return;
    }

    this.loadingInterviewees.set(true);
    this.interviewService
      .getIntervieweesByProcessId(processId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.interviewees.set(data);
          this.loadingInterviewees.set(false);
        },
        error: () => {
          this.toastService.showErrorKey('interview.interviewees.error.loadFailed');
          this.loadingInterviewees.set(false);
        },
      });
  }

  async loadApplicants(): Promise<void> {
    // Loads available applicants that can be added to the interview process.
    try {
      this.loadingApplicants.set(true);
      const result = await firstValueFrom(
        this.applicationService.getApplicationsDetails(0, 100, 'appliedAt', 'DESC', undefined, [this.jobTitle()], undefined),
      );
      this.applicants.set(result.applications ?? []);
    } catch {
      this.toastService.showErrorKey('interview.interviewees.error.loadApplicantsFailed');
    } finally {
      this.loadingApplicants.set(false);
    }
  }

  /**
   * Updates the active filter tab to show specific interviewee states.
   * @param filter The filter state to apply (e.g., 'ALL', 'UNCONTACTED').
   */
  setFilter(filter: FilterTab): void {
    this.activeFilter.set(filter);
  }

  openAddModal(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.selectedIds.set(new Set());
    this.showAddModal.set(false);
  }

  toggleSelection(applicationId: string): void {
    const selected = new Set(this.selectedIds());
    if (selected.has(applicationId)) {
      selected.delete(applicationId);
    } else {
      selected.add(applicationId);
    }
    this.selectedIds.set(selected);
  }

  isSelected(applicationId: string): boolean {
    return this.selectedIds().has(applicationId);
  }

  /**
   * Adds the selected applicants to the interview process.
   */
  addInterviewees(): void {
    const processId = this.processId();
    if (!processId) {
      return;
    }

    this.processingAdd.set(true);

    const dto: AddIntervieweesDTO = {
      applicationIds: Array.from(this.selectedIds()),
    };

    this.interviewService
      .addApplicantsToInterview(processId, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.showSuccessKey('interview.interviewees.success.added', { count: `${this.selectedCount()}` });
          this.closeAddModal();
          this.loadInterviewees();
          this.processingAdd.set(false);
        },
        error: () => {
          this.toastService.showErrorKey('interview.interviewees.error.addFailed');
          this.processingAdd.set(false);
        },
      });
  }
}

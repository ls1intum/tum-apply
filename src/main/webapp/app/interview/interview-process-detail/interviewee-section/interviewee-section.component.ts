import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import { ApplicationEvaluationResourceApiService } from 'app/generated';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { Section } from 'app/shared/components/atoms/section/section';

import { IntervieweeCardComponent } from './interviewee-card/interviewee-card.component';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';

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
    ProgressSpinnerModule,
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

  // Services
  private readonly http = inject(HttpClient);
  private readonly applicationService = inject(ApplicationEvaluationResourceApiService);
  private readonly toastService = inject(ToastService);

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

  // Applicants not yet added as interviewees
  availableApplicants = computed(() => {
    const existingIds = new Set(this.interviewees().map(i => i.applicationId));
    return this.applicants().filter(app => !existingIds.has(app.applicationDetailDTO.applicationId));
  });

  selectedCount = computed(() => this.selectedIds().size);

  // Effects
  private readonly loadEffect = effect(() => {
    if (this.processId()) {
      void this.loadInterviewees();
    }
  });

  private readonly modalOpenEffect = effect(() => {
    if (this.showAddModal() && this.jobTitle()) {
      void this.loadApplicants();
    }
  });

  // === Data Loading ===

  loadInterviewees(): void {
    const processId = this.processId();
    if (!processId) {
      return;
    }

    this.loadingInterviewees.set(true);
    this.http
      .get<IntervieweeDTO[]>(`/api/interviews/processes/${processId}/interviewees`)
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

  // === Filter ===

  setFilter(filter: FilterTab): void {
    this.activeFilter.set(filter);
  }

  // === Modal ===

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

  addInterviewees(): void {
    const processId = this.processId();
    if (!processId) {
      return;
    }

    this.processingAdd.set(true);

    this.http
      .post(`/api/interviews/processes/${processId}/interviewees`, {
        applicationIds: Array.from(this.selectedIds()),
      })
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

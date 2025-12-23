import { Component, TemplateRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { ApplicationEvaluationResourceApiService, InterviewResourceApiService } from 'app/generated';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { AddIntervieweesDTO } from 'app/generated/model/addIntervieweesDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { Section } from 'app/shared/components/atoms/section/section';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';

import { IntervieweeCardComponent } from './interviewee-card/interviewee-card.component';

type FilterTab = 'ALL' | 'UNCONTACTED' | 'INVITED' | 'SCHEDULED' | 'COMPLETED';

interface ApplicantRow {
  applicationId: string;
  name: string;
  selected: boolean;
}

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
    DynamicTableComponent,
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

  // Pagination state for modal table
  pageNumber = signal<number>(0);
  pageSize = signal<number>(10);
  totalApplicants = signal<number>(0);

  // Template references for dynamic table columns
  readonly nameTemplate = viewChild.required<TemplateRef<unknown>>('nameTemplate');

  // Column definition for dynamic table
  readonly columns = computed<DynamicTableColumn[]>(() => {
    const nameTemplate = this.nameTemplate();
    return [{ field: 'name', header: 'interview.interviewees.tableColumns.name', width: '100%', template: nameTemplate }];
  });

  // Transform applicants data for table display
  readonly tableData = computed<ApplicantRow[]>(() => {
    const existingIds = new Set(this.interviewees().map(i => i.applicationId));
    const selected = this.selectedIds();

    return this.applicants()
      .filter(app => !existingIds.has(app.applicationDetailDTO.applicationId))
      .map(app => {
        const user = app.applicationDetailDTO.applicant?.user;
        // Handle case where backend returns 'null null' when firstName/lastName are null
        let name = user?.name ?? 'Unknown';
        if (name === 'null null' || name.trim() === '') {
          name = 'Unknown';
        }
        return {
          applicationId: app.applicationDetailDTO.applicationId,
          name,
          selected: selected.has(app.applicationDetailDTO.applicationId),
        };
      });
  });

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

  selectedCount = computed(() => this.selectedIds().size);

  // Services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly applicationService = inject(ApplicationEvaluationResourceApiService);
  private readonly toastService = inject(ToastService);

  // Effects
  private readonly loadEffect = effect(() => {
    if (this.processId()) {
      void this.loadInterviewees();
    }
  });

  async loadInterviewees(): Promise<void> {
    // Loads the list of interviewees for the current process.
    const processId = this.processId();
    if (!processId) {
      return;
    }

    try {
      this.loadingInterviewees.set(true);
      const data = await firstValueFrom(this.interviewService.getIntervieweesByProcessId(processId));
      this.interviewees.set(data);
    } catch {
      this.toastService.showErrorKey('interview.interviewees.error.loadFailed');
    } finally {
      this.loadingInterviewees.set(false);
    }
  }

  async loadApplicants(): Promise<void> {
    try {
      this.loadingApplicants.set(true);
      const result = await firstValueFrom(
        this.applicationService.getApplicationsDetails(
          this.pageNumber(),
          this.pageSize(),
          'appliedAt',
          'DESC',
          ['IN_REVIEW'],
          [this.jobTitle()],
          undefined,
        ),
      );
      this.applicants.set(result.applications ?? []);
      this.totalApplicants.set(result.totalRecords ?? 0);
    } catch {
      this.toastService.showErrorKey('interview.interviewees.error.loadApplicantsFailed');
    } finally {
      this.loadingApplicants.set(false);
    }
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);
    this.pageSize.set(rows);
    void this.loadApplicants();
  }

  setFilter(filter: FilterTab): void {
    this.activeFilter.set(filter);
  }

  openAddModal(): void {
    this.showAddModal.set(true);
    void this.loadApplicants();
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

  async addInterviewees(): Promise<void> {
    const processId = this.processId();
    if (!processId) {
      return;
    }

    const dto: AddIntervieweesDTO = {
      applicationIds: Array.from(this.selectedIds()),
    };

    try {
      this.processingAdd.set(true);
      await firstValueFrom(this.interviewService.addApplicantsToInterview(processId, dto));
      this.toastService.showSuccessKey('interview.interviewees.addSuccess', { count: `${this.selectedCount()}` });
      this.closeAddModal();
      void this.loadInterviewees();
    } catch {
      this.toastService.showErrorKey('interview.interviewees.error.addFailed');
    } finally {
      this.processingAdd.set(false);
    }
  }
}

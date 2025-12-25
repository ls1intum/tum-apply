import { Component, TemplateRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CheckboxModule } from 'primeng/checkbox';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { ApplicationEvaluationResourceApiService, InterviewResourceApiService } from 'app/generated';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { AddIntervieweesDTO } from 'app/generated/model/addIntervieweesDTO';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';
import { Section } from 'app/shared/components/atoms/section/section';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import TranslateDirective from 'app/shared/language/translate.directive';

import { IntervieweeCardComponent } from './interviewee-card/interviewee-card.component';

// Filter tabs for interviewee states
type FilterTab = 'ALL' | 'UNCONTACTED' | 'INVITED' | 'SCHEDULED' | 'COMPLETED';

// Row data structure for the applicant selection table
interface ApplicantRow {
  applicationId: string;
  name: string;
  selected: boolean;
}

@Component({
  selector: 'jhi-interviewee-section',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    TranslateDirective,
    CheckboxModule,
    ButtonComponent,
    DialogComponent,
    Section,
    IntervieweeCardComponent,
    DynamicTableComponent,
  ],
  templateUrl: './interviewee-section.component.html',
})
export class IntervieweeSectionComponent {
  // Component Inputs
  processId = input.required<string>();
  jobTitle = input.required<string>();

  // Interviewee List State
  interviewees = signal<IntervieweeDTO[]>([]); // All interviewees for this process
  loadingInterviewees = signal(false);
  activeFilter = signal<FilterTab>('ALL'); // Currently selected filter tab

  // Add Applicant Modal State
  showAddModal = signal(false);
  applicants = signal<ApplicationEvaluationDetailDTO[]>([]); // Available applicants to add
  selectedIds = signal<Set<string>>(new Set()); // Selected application IDs
  loadingApplicants = signal(false);
  processingAdd = signal(false); // True while adding interviewees

  // Pagination for Modal Table
  pageNumber = signal(0);
  pageSize = signal(10);
  totalApplicants = signal(0);

  // Template Reference for Table Column
  readonly nameTemplate = viewChild.required<TemplateRef<unknown>>('nameTemplate');

  // Computed: Filter Tabs with Counts
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

  // Computed: Filtered Interviewees
  filteredInterviewees = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.interviewees();
    return this.interviewees().filter(i => i.state === filter);
  });

  // Table Column Definition
  readonly columns = computed<DynamicTableColumn[]>(() => [
    { field: 'name', header: 'interview.interviewees.tableColumns.name', width: '100%', template: this.nameTemplate() },
  ]);

  // Computed: Table Data for Add Modal
  readonly tableData = computed<ApplicantRow[]>(() => {
    const existingIds = new Set(this.interviewees().map(i => i.applicationId));
    const selected = this.selectedIds();

    return this.applicants()
      .filter(app => !existingIds.has(app.applicationDetailDTO.applicationId))
      .map(app => {
        const user = app.applicationDetailDTO.applicant?.user;
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

  // Computed: Selection Count
  selectedCount = computed(() => this.selectedIds().size);

  // Injected Services (private)
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly applicationService = inject(ApplicationEvaluationResourceApiService);
  private readonly toastService = inject(ToastService);

  // Effect: Auto load Interviewees when processId changes
  private readonly loadEffect = effect(() => {
    if (this.processId()) {
      void this.loadInterviewees();
    }
  });

  // Data Loading: Interviewees
  async loadInterviewees(): Promise<void> {
    const processId = this.processId();
    if (!processId) return;

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

  // Data Loading: Available Applicants (for Add Modal)
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

  // Filter Tab Selection
  setFilter(filter: FilterTab): void {
    this.activeFilter.set(filter);
  }

  // Modal Control
  openAddModal(): void {
    this.showAddModal.set(true);
    void this.loadApplicants();
  }

  closeAddModal(): void {
    this.selectedIds.set(new Set());
    this.showAddModal.set(false);
  }

  // Selection Handling
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

  // Table Pagination Handler
  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);
    this.pageSize.set(rows);
    void this.loadApplicants();
  }

  // Add Selected Applicants as Interviewees
  async addInterviewees(): Promise<void> {
    const processId = this.processId();
    if (!processId) return;

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

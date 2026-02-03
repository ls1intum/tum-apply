import { Component, TemplateRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { CheckboxComponent } from 'app/shared/components/atoms/checkbox/checkbox.component';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom, map } from 'rxjs';
import { ApplicationEvaluationResourceApiService, InterviewResourceApiService } from 'app/generated';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { AddIntervieweesDTO } from 'app/generated/model/addIntervieweesDTO';
import { IntervieweeDTO } from 'app/generated/model/intervieweeDTO';
import { SendInvitationsResultDTO } from 'app/generated/model/sendInvitationsResultDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';
import { FilterTab, FilterTabsComponent } from 'app/shared/components/atoms/filter-tabs/filter-tabs.component';
import { Section } from 'app/shared/components/atoms/section/section';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';

import { IntervieweeCardComponent } from './interviewee-card/interviewee-card.component';

// Filter key type for interviewee states
type FilterKey = 'ALL' | 'UNCONTACTED' | 'INVITED' | 'SCHEDULED' | 'COMPLETED';

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
    CheckboxComponent,
    ButtonComponent,
    DialogComponent,
    FilterTabsComponent,
    Section,
    IntervieweeCardComponent,
    DynamicTableComponent,
    ConfirmDialog,
  ],
  templateUrl: './interviewee-section.component.html',
})
export class IntervieweeSectionComponent {
  // Component Inputs
  processId = input.required<string>();
  jobTitle = input.required<string>();
  refreshKey = input<number>(0);

  // Outputs
  requestAddSlots = output();

  // Interviewee List State
  interviewees = signal<IntervieweeDTO[]>([]); // All interviewees for this process
  loadingInterviewees = signal(false);
  activeFilter = signal<FilterKey>('ALL'); // Currently selected filter tab

  // Add Applicant Modal State
  showAddModal = signal(false);
  applicants = signal<ApplicationEvaluationDetailDTO[]>([]); // Available applicants to add
  selectedIds = signal<Set<string>>(new Set()); // Selected application IDs
  loadingApplicants = signal(false);
  processingAdd = signal(false); // True while adding interviewees

  // Invitation Sending State
  sendingInvitationId = signal<string | null>(null);
  sendingBulk = signal(false);

  // Pagination for Modal Table
  pageNumber = signal(0);
  pageSize = signal(10);
  totalApplicants = signal(0);
  pendingResendId = signal<string | null>(null);

  // Template References
  readonly nameTemplate = viewChild.required<TemplateRef<unknown>>('nameTemplate');
  readonly resendDialog = viewChild.required<ConfirmDialog>('resendDialog');
  readonly insufficientSlotsDialog = viewChild.required<ConfirmDialog>('insufficientSlotsDialog');

  // Computed Signals
  filterTabs = computed<FilterTab<FilterKey>[]>(() => {
    const all = this.interviewees();
    return [
      { key: 'ALL', labelKey: 'interview.interviewees.filter.ALL', count: all.length },
      { key: 'INVITED', labelKey: 'interview.interviewees.filter.INVITED', count: all.filter(i => i.state === 'INVITED').length },
      { key: 'SCHEDULED', labelKey: 'interview.interviewees.filter.SCHEDULED', count: all.filter(i => i.state === 'SCHEDULED').length },
      {
        key: 'UNCONTACTED',
        labelKey: 'interview.interviewees.filter.UNCONTACTED',
        count: all.filter(i => i.state === 'UNCONTACTED').length,
      },
      { key: 'COMPLETED', labelKey: 'interview.interviewees.filter.COMPLETED', count: all.filter(i => i.state === 'COMPLETED').length },
    ];
  });

  // Computed: Count of uncontacted interviewees (for bulk send button)
  uncontactedCount = computed(() => this.interviewees().filter(i => i.state === 'UNCONTACTED').length);

  // Computed: Filtered Interviewees
  filteredInterviewees = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.interviewees();
    return this.interviewees().filter(i => i.state === filter);
  });

  columns = computed<DynamicTableColumn[]>(() => [
    { field: 'name', header: 'interview.interviewees.tableColumns.name', width: '100%', template: this.nameTemplate() },
  ]);

  tableData = computed<ApplicantRow[]>(() => {
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

  allInvitedTooltip = computed(() => {
    this.currentLang(); // Dependency for reactivity
    return this.uncontactedCount() === 0 ? this.translateService.instant('interview.interviewees.allInvited') : '';
  });

  resendConfirmation = computed(() => {
    this.currentLang(); // Dependency
    return {
      header: this.translateService.instant('interview.interviewees.resendConfirmation.header'),
      message: this.translateService.instant('interview.interviewees.resendConfirmation.message'),
      label: this.translateService.instant('interview.interviewees.resendInvitation'),
    };
  });

  // Services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly applicationService = inject(ApplicationEvaluationResourceApiService);
  private readonly toastService = inject(ToastService);
  private readonly translateService = inject(TranslateService);

  private readonly currentLang = toSignal(this.translateService.onLangChange.pipe(map((event: LangChangeEvent) => event.lang)), {
    initialValue: this.translateService.getCurrentLang(),
  });

  // Effect: Auto load Interviewees when processId or refreshKey changes
  private readonly loadEffect = effect(() => {
    this.refreshKey(); // Track refreshKey to trigger reload
    if (this.processId()) {
      void this.loadInterviewees();
    }
  });

  // Add Selected Applicants as Interviewees
  async addInterviewees(): Promise<void> {
    const processId = this.processId();
    if (processId === '') return;

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

  // Data Loading: Interviewees
  async loadInterviewees(): Promise<void> {
    const processId = this.processId();
    if (processId === '') return;

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

  async sendInvitation(interviewee: IntervieweeDTO): Promise<void> {
    const processId = this.processId();
    if (processId === '' || interviewee.id === undefined) return;

    // Check capacity for single invitation (including resend)
    try {
      const futureSlots = await firstValueFrom(this.interviewService.countAvailableFutureSlots(processId));
      if (futureSlots === 0) {
        this.insufficientSlotsDialog().confirm();
        return;
      }

      if (interviewee.state === 'INVITED') {
        this.pendingResendId.set(interviewee.id);
        this.resendDialog().confirm();
      } else {
        void this.performSendInvitation(processId, interviewee.id);
      }
    } catch {
      this.toastService.showErrorKey('interview.interviewees.invitation.error');
    }
  }

  // Send bulk invitations to all uncontacted
  async sendAllInvitations(): Promise<void> {
    const processId = this.processId();
    if (processId === '') return;

    const count = this.uncontactedCount();
    if (count === 0) return;

    // Check capacity before sending
    try {
      this.sendingBulk.set(true);
      const futureSlots = await firstValueFrom(this.interviewService.countAvailableFutureSlots(processId));

      if (futureSlots < count) {
        this.insufficientSlotsDialog().confirm();
      } else {
        void this.performBulkSend();
      }
    } catch {
      void this.performBulkSend();
    } finally {
      this.sendingBulk.set(false);
    }
  }

  confirmInsufficientSlots(): void {
    this.requestAddSlots.emit();
  }

  onConfirmResend(): void {
    const id = this.pendingResendId();
    const processId = this.processId();
    if (id !== null && processId) {
      void this.performSendInvitation(processId, id);
      this.pendingResendId.set(null);
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

  // Table Pagination Handler
  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);
    this.pageSize.set(rows);
    void this.loadApplicants();
  }

  // Filter Tab Selection
  setFilter(filter: FilterKey): void {
    this.activeFilter.set(filter);
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

  // Modal Control
  openAddModal(): void {
    this.showAddModal.set(true);
    void this.loadApplicants();
  }

  closeAddModal(): void {
    this.selectedIds.set(new Set());
    this.showAddModal.set(false);
  }

  // Private Methods
  private handleInvitationResult(result: SendInvitationsResultDTO): void {
    const sentCount = result.sentCount ?? 0;
    const failedCount = result.failedEmails?.length ?? 0;

    if (sentCount > 0 && failedCount === 0) {
      // All successful
      if (sentCount === 1) {
        this.toastService.showSuccessKey('interview.interviewees.invitation.successSingle');
      } else {
        this.toastService.showSuccessKey('interview.interviewees.invitation.success', {
          count: sentCount.toString(),
        });
      }
    } else if (sentCount > 0 && failedCount > 0) {
      // Partial success
      const failedList = result.failedEmails?.join(', ') ?? '';
      this.toastService.showWarn({
        summary: this.translateService.instant('interview.interviewees.invitation.partial.summary', {
          sent: sentCount.toString(),
          failed: failedCount.toString(),
        }),
        detail: failedList ? this.translateService.instant('interview.interviewees.invitation.partial.detail', { emails: failedList }) : '',
        life: 10000,
      });
    } else {
      // All failed
      this.toastService.showErrorKey('interview.interviewees.invitation.error');
    }
    void this.loadInterviewees();
  }

  private async performSendInvitation(processId: string, intervieweeId: string): Promise<void> {
    try {
      this.sendingInvitationId.set(intervieweeId);
      const result = await firstValueFrom(
        this.interviewService.sendInvitations(processId, {
          intervieweeIds: [intervieweeId],
        }),
      );
      this.handleInvitationResult(result);
    } catch {
      this.toastService.showErrorKey('interview.interviewees.invitation.error');
    } finally {
      this.sendingInvitationId.set(null);
    }
  }
  // Helper method to execute the bulk invitation logic
  private async performBulkSend(): Promise<void> {
    try {
      this.sendingBulk.set(true);
      const result = await firstValueFrom(
        this.interviewService.sendInvitations(this.processId(), {
          onlyUninvited: true,
        }),
      );
      this.handleInvitationResult(result);
    } catch {
      this.toastService.showErrorKey('interview.interviewees.invitation.error');
    } finally {
      this.sendingBulk.set(false);
    }
  }
}

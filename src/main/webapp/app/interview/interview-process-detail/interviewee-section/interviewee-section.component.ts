import { Component, TemplateRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom, map } from 'rxjs';
import { GetApplicationsDetailsParams, getApplicationsDetailsResource } from 'app/generated/api/application-evaluation-resource-api';
import { InterviewResourceApi, getIntervieweesByProcessIdResource } from 'app/generated/api/interview-resource-api';
import { ApplicationDetailDTOApplicationStateEnum } from 'app/generated/model/application-detail-dto';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/application-evaluation-detail-dto';
import { AddIntervieweesDTO } from 'app/generated/model/add-interviewees-dto';
import { IntervieweeDTO, IntervieweeDTOStateEnum } from 'app/generated/model/interviewee-dto';
import { SendInvitationsResultDTO } from 'app/generated/model/send-invitations-result-dto';
import { CancelInterviewDTO } from 'app/generated/model/cancel-interview-dto';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';
import { FilterTab, FilterTabsComponent } from 'app/shared/components/atoms/filter-tabs/filter-tabs.component';
import { Section } from 'app/shared/components/atoms/section/section';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { CheckboxComponent } from 'app/shared/components/atoms/checkbox/checkbox.component';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';

import { CancelInterviewModalComponent } from '../cancel-interview-modal/cancel-interview-modal.component';

import { IntervieweeCardComponent } from './interviewee-card/interviewee-card.component';

// Filter key type for interviewee states
type FilterKey = 'ALL' | IntervieweeDTOStateEnum;

// Row data structure for the applicant selection table
interface ApplicantRow {
  applicationId: string;
  name: string;
  avatar?: string;
  selected: boolean;
}

@Component({
  selector: 'jhi-interviewee-section',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    TranslateDirective,
    ButtonComponent,
    DialogComponent,
    FilterTabsComponent,
    Section,
    IntervieweeCardComponent,
    DynamicTableComponent,
    ConfirmDialog,
    CheckboxComponent,
    UserAvatarComponent,
    CancelInterviewModalComponent,
  ],
  templateUrl: './interviewee-section.component.html',
})
export class IntervieweeSectionComponent {
  // Component Inputs
  processId = input.required<string>();
  jobTitle = input.required<string>();
  isClosed = input<boolean>(false);
  refreshKey = input<number>(0);
  hasSlots = input<boolean>(false);

  // Component Outputs
  slotsRefresh = output();

  // Interviewee Resource
  readonly intervieweesResource = getIntervieweesByProcessIdResource(this.processId);

  // Interviewee List State
  interviewees = computed<IntervieweeDTO[]>(() => this.intervieweesResource.value() ?? []);
  loadingInterviewees = computed(() => this.intervieweesResource.isLoading());
  activeFilter = signal<FilterKey>('ALL'); // Currently selected filter tab

  // Applicants Resource
  private readonly applicantsParams = signal<GetApplicationsDetailsParams>({
    offset: 0,
    limit: 10,
    sortBy: 'appliedAt',
    direction: 'DESC',
    status: [ApplicationDetailDTOApplicationStateEnum.InReview],
    job: [],
  });
  private readonly applicantsResource = getApplicationsDetailsResource(this.applicantsParams);

  // Add Applicant Modal State
  showAddModal = signal(false);
  applicants = computed<ApplicationEvaluationDetailDTO[]>(() => this.applicantsResource.value()?.applications ?? []);
  selectedIds = signal<Set<string>>(new Set()); // Selected application IDs
  loadingApplicants = computed(() => this.applicantsResource.isLoading());
  processingAdd = signal(false); // True while adding interviewees

  // Invitation Sending State
  sendingInvitationId = signal<string | null>(null);
  sendingBulk = signal(false);

  // Pagination for Modal Table
  pageNumber = signal(0);
  pageSize = signal(10);
  totalApplicants = computed(() => this.applicantsResource.value()?.totalRecords ?? 0);
  pendingResendId = signal<string | null>(null);

  // Cancellation State
  showCancelModal = signal(false);
  selectedIntervieweeForCancel = signal<IntervieweeDTO | undefined>(undefined);

  // Template References
  readonly nameTemplate = viewChild.required<TemplateRef<unknown>>('nameTemplate');
  showResendDialog = signal(false);

  // Computed Signals
  filterTabs = computed<FilterTab<FilterKey>[]>(() => {
    const all = this.interviewees();
    return [
      {
        key: 'ALL',
        labelKey: 'interview.interviewees.filter.ALL',
        count: all.length,
        tooltipKey: 'interview.interviewees.filter.tooltip.ALL',
      },
      {
        key: IntervieweeDTOStateEnum.Uncontacted,
        labelKey: 'interview.interviewees.filter.UNCONTACTED',
        count: all.filter(i => i.state === IntervieweeDTOStateEnum.Uncontacted).length,
        tooltipKey: 'interview.interviewees.filter.tooltip.UNCONTACTED',
      },
      {
        key: IntervieweeDTOStateEnum.Invited,
        labelKey: 'interview.interviewees.filter.INVITED',
        count: all.filter(i => i.state === IntervieweeDTOStateEnum.Invited).length,
        tooltipKey: 'interview.interviewees.filter.tooltip.INVITED',
      },
      {
        key: IntervieweeDTOStateEnum.Scheduled,
        labelKey: 'interview.interviewees.filter.SCHEDULED',
        count: all.filter(i => i.state === IntervieweeDTOStateEnum.Scheduled).length,
        tooltipKey: 'interview.interviewees.filter.tooltip.SCHEDULED',
      },
      {
        key: IntervieweeDTOStateEnum.Completed,
        labelKey: 'interview.interviewees.filter.COMPLETED',
        count: all.filter(i => i.state === IntervieweeDTOStateEnum.Completed).length,
        tooltipKey: 'interview.interviewees.filter.tooltip.COMPLETED',
      },
    ];
  });

  // Computed: Count of uncontacted interviewees (for bulk send button)
  uncontactedCount = computed(() => this.interviewees().filter(i => i.state === IntervieweeDTOStateEnum.Uncontacted).length);

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
          avatar: user?.avatar,
          selected: selected.has(app.applicationDetailDTO.applicationId),
        };
      });
  });

  // Computed: Selection Count
  selectedCount = computed(() => this.selectedIds().size);

  allInvitedTooltip = computed(() => {
    this.currentLang(); // Dependency for reactivity
    if (!this.hasSlots()) {
      return this.translateService.instant('interview.interviewees.invitation.noSlots.detail');
    }
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
  private readonly interviewApi = inject(InterviewResourceApi);
  private readonly toastService = inject(ToastService);
  private readonly translateService = inject(TranslateService);

  private readonly currentLang = toSignal(this.translateService.onLangChange.pipe(map((event: LangChangeEvent) => event.lang)), {
    initialValue: this.translateService.getCurrentLang(),
  });

  // Effect: Reload interviewees when refreshKey changes
  private readonly loadEffect = effect(() => {
    this.refreshKey(); // Track refreshKey to trigger reload
    if (this.processId()) {
      this.intervieweesResource.reload();
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
      await firstValueFrom(this.interviewApi.addApplicantsToInterview(processId, dto));
      this.toastService.showSuccessKey('interview.interviewees.addSuccess', { count: `${this.selectedCount()}` });
      this.closeAddModal();
      this.intervieweesResource.reload();
    } catch {
      this.toastService.showErrorKey('interview.interviewees.error.addFailed');
    } finally {
      this.processingAdd.set(false);
    }
  }

  sendInvitation(interviewee: IntervieweeDTO): void {
    const processId = this.processId();
    if (processId === '' || interviewee.id == null) return;

    if (!this.hasSlots()) {
      this.toastService.showWarnKey('interview.interviewees.invitation.noSlots');
      return;
    }

    if (interviewee.state === IntervieweeDTOStateEnum.Invited) {
      this.pendingResendId.set(interviewee.id);
      this.showResendDialog.set(true);
    } else {
      void this.performSendInvitation(processId, interviewee.id);
    }
  }

  // Send bulk invitations to all uncontacted
  async sendAllInvitations(): Promise<void> {
    const processId = this.processId();
    if (processId === '') return;

    if (!this.hasSlots()) {
      this.toastService.showWarnKey('interview.interviewees.invitation.noSlots');
      return;
    }

    try {
      this.sendingBulk.set(true);
      const result = await firstValueFrom(
        this.interviewApi.sendInvitations(processId, {
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

  // Data Loading: Available Applicants (for Add Modal)
  loadApplicants(): void {
    this.applicantsParams.set({
      offset: this.pageNumber(),
      limit: this.pageSize(),
      sortBy: 'appliedAt',
      direction: 'DESC',
      status: [ApplicationDetailDTOApplicationStateEnum.InReview],
      job: [this.jobTitle()],
    });
  }

  // Table Pagination Handler
  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);
    this.pageSize.set(rows);
    this.loadApplicants();
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
    this.loadApplicants();
  }

  closeAddModal(): void {
    this.selectedIds.set(new Set());
    this.showAddModal.set(false);
  }

  onConfirmResend(): void {
    const id = this.pendingResendId();
    const processId = this.processId();
    if (id !== null && processId !== '') {
      void this.performSendInvitation(processId, id);
      this.pendingResendId.set(null);
    }
  }

  onCancelInterview(interviewee: IntervieweeDTO): void {
    this.selectedIntervieweeForCancel.set(interviewee);
    this.showCancelModal.set(true);
  }

  async onCancelInterviewConfirm(cancelParams: CancelInterviewDTO): Promise<void> {
    const interviewee = this.selectedIntervieweeForCancel();
    const processId = this.processId();
    if (interviewee?.scheduledSlot?.id == null || processId === '') return;

    try {
      await firstValueFrom(this.interviewApi.cancelInterview(processId, interviewee.scheduledSlot.id, cancelParams));

      this.toastService.showSuccessKey('interview.slots.cancelInterview.success');

      // Reload interviewees from server to get accurate state
      this.intervieweesResource.reload();

      // Notify parent to refresh slots section
      this.slotsRefresh.emit();
    } catch {
      this.toastService.showErrorKey('interview.slots.cancelInterview.error');
    } finally {
      this.showCancelModal.set(false);
      this.selectedIntervieweeForCancel.set(undefined);
    }
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
    this.intervieweesResource.reload();
  }

  private async performSendInvitation(processId: string, intervieweeId: string): Promise<void> {
    try {
      this.sendingInvitationId.set(intervieweeId);
      const result = await firstValueFrom(
        this.interviewApi.sendInvitations(processId, {
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
}

import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { ResearchGroupResourceApiService } from 'app/generated/api/api';
import { ResearchGroupShortDTO, UserShortDTO } from 'app/generated/model/models';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

interface MemberRow {
  email?: string;
  firstName?: string;
  lastName?: string;
  researchGroup?: ResearchGroupShortDTO;
  roles?: UserShortDTO.RolesEnum[];
  userId?: string;
  name: string;
  role: string;
  isCurrentUser: boolean;
}

@Component({
  selector: 'jhi-research-group-remove-members.component',
  imports: [DynamicTableComponent, ConfirmDialog, FontAwesomeModule, TranslateModule, ButtonComponent, CheckboxModule, FormsModule],
  templateUrl: './research-group-remove-members.component.html',
})
export class ResearchGroupRemoveMembersComponent {
  researchGroupId = computed(() => this.config.data?.researchGroupId as string | undefined);

  members = signal<UserShortDTO[]>([]);
  pageNumber = signal<number>(0);
  pageSize = signal<number>(10);
  total = signal<number>(0);
  selectedMembers = signal<Map<string, UserShortDTO>>(new Map());
  selectedCount = computed(() => this.selectedMembers().size);

  readonly nameTemplate = viewChild.required<TemplateRef<unknown>>('nameTemplate');
  readonly deleteTemplate = viewChild.required<TemplateRef<unknown>>('deleteTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const nameTemplate = this.nameTemplate();
    const deleteTemplate = this.deleteTemplate();

    return [
      { field: 'name', header: 'researchGroup.members.tableColumns.name', width: '30rem', template: nameTemplate },
      { field: 'email', header: 'researchGroup.members.tableColumns.email', width: '26rem' },
      { field: 'role', header: 'researchGroup.members.tableColumns.role', width: '22rem' },
      { field: 'actions', header: '', width: '5rem', template: deleteTemplate },
    ];
  });

  // Transform members data for display
  readonly tableData = computed<MemberRow[]>(() => {
    return this.members().map((member): MemberRow => {
      const isCurrentUser = this.isCurrentUser(member);
      return {
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        researchGroup: member.researchGroup,
        roles: member.roles,
        userId: member.userId,
        name: `${member.firstName} ${member.lastName}`,
        role: this.formatRoles(member.roles),
        isCurrentUser,
      };
    });
  });

  private researchGroupService = inject(ResearchGroupResourceApiService);
  private toastService = inject(ToastService);
  private accountService = inject(AccountService);
  private translate = inject(TranslateService);
  private readonly dialogRef = inject(DynamicDialogRef);

  private readonly config = inject(DynamicDialogConfig);
  private readonly translationKey: string = 'researchGroup.members';

  constructor() {
    void this.loadMembers();
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);
    this.pageSize.set(rows);

    void this.loadMembers();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async loadMembers(): Promise<void> {
    try {
      const researchGroupId = this.researchGroupId();
      if (!researchGroupId) {
        this.toastService.showErrorKey(`${this.translationKey}.toastMessages.loadFailed`);
        return;
      }
      const members = await firstValueFrom(
        this.researchGroupService.getResearchGroupMembersById(researchGroupId, this.pageSize(), this.pageNumber()),
      );

      this.members.set(members.content ?? []);
      this.total.set(members.totalElements ?? 0);
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.toastMessages.loadFailed`);
    }
  }

  async removeMember(member: UserShortDTO): Promise<void> {
    try {
      await firstValueFrom(this.researchGroupService.removeMemberFromResearchGroup(member.userId ?? ''));
      this.toastService.showSuccessKey(`${this.translationKey}.toastMessages.removeSuccess`, {
        memberName: `${member.firstName} ${member.lastName}`,
      });

      // Refresh the members list
      await this.loadMembers();
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.toastMessages.removeFailed`, {
        memberName: `${member.firstName} ${member.lastName}`,
      });
    }
  }

  toggleMemberSelection(member: UserShortDTO): void {
    const id = member.userId ?? '';
    const current = new Map(this.selectedMembers());
    if (!id) {
      return;
    }
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.set(id, member);
    }
    this.selectedMembers.set(current);
  }

  async removeSelectedMembers(): Promise<void> {
    const members = Array.from(this.selectedMembers().values());
    if (members.length === 0) {
      return;
    }
    try {
      // call deletion for each member and wait for all
      await Promise.all(members.map(m => firstValueFrom(this.researchGroupService.removeMemberFromResearchGroup(m.userId ?? ''))));
      this.toastService.showSuccessKey(`${this.translationKey}.toastMessages.removeSuccess`, {
        memberName: members.map(m => `${m.firstName} ${m.lastName}`).join(', '),
      });
      this.selectedMembers.set(new Map());
      await this.loadMembers();
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.toastMessages.removeFailed`);
    }
  }

  private formatRoles(roles?: string[]): string {
    if (!roles || roles.length === 0) {
      return this.translate.instant(`${this.translationKey}.noRole`);
    }

    return roles[0].charAt(0).toUpperCase() + roles[0].slice(1).toLowerCase();
  }

  private isCurrentUser(member: UserShortDTO): boolean {
    return member.userId === this.accountService.userId;
  }
}

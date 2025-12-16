import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableLazyLoadEvent } from 'primeng/table';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DialogService } from 'primeng/dynamicdialog';

import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ConfirmDialog } from '../../../shared/components/atoms/confirm-dialog/confirm-dialog';
import { UserShortDTO } from '../../../generated/model/userShortDTO';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { AccountService } from '../../../core/auth/account.service';
import { ResearchGroupResourceApiService } from '../../../generated/api/researchGroupResourceApi.service';
import { ResearchGroupAddMembersComponent } from '../research-group-add-members/research-group-add-members.component';

@Component({
  selector: 'jhi-research-group-members',
  imports: [
    ButtonComponent,
    TranslateDirective,
    FontAwesomeModule,
    TranslateModule,
    DynamicTableComponent,
    DialogModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialog,
  ],
  templateUrl: './research-group-members.component.html',
  styleUrl: './research-group-members.component.scss',
})
export class ResearchGroupMembersComponent {
  members = signal<UserShortDTO[]>([]);
  pageNumber = signal<number>(0);
  pageSize = signal<number>(10);
  total = signal<number>(0);

  readonly nameTemplate = viewChild.required<TemplateRef<unknown>>('nameTemplate');
  readonly deleteTemplate = viewChild.required<TemplateRef<unknown>>('deleteTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const nameTemplate = this.nameTemplate();
    const deleteTemplate = this.deleteTemplate();

    return [
      { field: 'name', header: 'researchGroup.members.tableColumns.name', width: '26rem', template: nameTemplate },
      { field: 'email', header: 'researchGroup.members.tableColumns.email', width: '26rem' },
      { field: 'role', header: 'researchGroup.members.tableColumns.role', width: '26rem' },
      { field: 'actions', header: '', width: '5rem', template: deleteTemplate },
    ];
  });

  // Transform members data for display
  readonly tableData = computed(() => {
    const currentUserAuthorities = this.accountService.userAuthorities;
    const isEmployee = currentUserAuthorities?.includes(UserShortDTO.RolesEnum.Employee);

    return this.members().map(member => {
      const isCurrentUser = this.isCurrentUser(member);
      let canRemove = !isCurrentUser;

      if (isEmployee) {
        canRemove = false;
      }

      return {
        ...member,
        name: `${member.firstName} ${member.lastName}`,
        role: this.formatRoles(member.roles),
        isCurrentUser,
        canRemove,
      };
    });
  });

  private researchGroupService = inject(ResearchGroupResourceApiService);
  private toastService = inject(ToastService);
  private accountService = inject(AccountService);
  private translate = inject(TranslateService);
  private readonly dialogService = inject(DialogService);

  private readonly translationKey: string = 'researchGroup.members';

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);
    this.pageSize.set(rows);

    void this.loadMembers();
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

  async loadMembers(): Promise<void> {
    try {
      const members = await firstValueFrom(this.researchGroupService.getResearchGroupMembers(this.pageSize(), this.pageNumber()));

      this.members.set(members.content ?? []);
      this.total.set(members.totalElements ?? 0);
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.toastMessages.loadFailed`);
    }
  }

  openAddMembersModal(): void {
    const ref = this.dialogService.open(ResearchGroupAddMembersComponent, {
      header: this.translate.instant('researchGroup.members.addMembers'),
      style: { background: 'var(--p-background-default)', width: '50rem' },
      closable: true,
      draggable: false,
      modal: true,
    });

    ref?.onClose.subscribe((added: boolean) => {
      if (added) {
        void this.loadMembers();
      }
    });
  }

  /** Internal methods */

  private formatRoles(roles?: string[]): string {
    if (!roles || roles.length === 0) {
      return this.translate.instant(`${this.translationKey}.noRole`);
    }

    // Capitalize first letter and make it singular
    return roles[0].charAt(0).toUpperCase() + roles[0].slice(1).toLowerCase();
  }

  private isCurrentUser(member: UserShortDTO): boolean {
    return member.userId === this.accountService.userId;
  }
}

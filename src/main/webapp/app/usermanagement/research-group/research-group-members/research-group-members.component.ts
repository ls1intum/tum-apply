import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { ResearchGroupShortDTO, UserShortDTO } from 'app/generated/model/models';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ConfirmDialog } from '../../../shared/components/atoms/confirm-dialog/confirm-dialog';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { AccountService } from '../../../core/auth/account.service';
import { ResearchGroupResourceApiService } from '../../../generated/api/researchGroupResourceApi.service';
import { ResearchGroupAddMembersComponent } from '../research-group-add-members/research-group-add-members.component';

interface MembersRow {
  email?: string;
  firstName?: string;
  lastName?: string;
  researchGroup?: ResearchGroupShortDTO;
  roles?: UserShortDTO.RolesEnum[];
  userId?: string;
  name: string;
  role: string;
  isCurrentUser: boolean;
  canRemove: boolean;
}

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

  researchGroupId = signal<string | undefined>(undefined);

  readonly nameTemplate = viewChild.required<TemplateRef<unknown>>('nameTemplate');
  readonly deleteTemplate = viewChild.required<TemplateRef<unknown>>('deleteTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const nameTemplate = this.nameTemplate();
    const deleteTemplate = this.deleteTemplate();

    return [
      { field: 'name', header: `${this.translationKey}.tableColumns.name`, width: '26rem', template: nameTemplate },
      { field: 'email', header: `${this.translationKey}.tableColumns.email`, width: '26rem' },
      { field: 'role', header: `${this.translationKey}.tableColumns.role`, width: '26rem' },
      { field: 'actions', header: '', width: '5rem', template: deleteTemplate },
    ];
  });

  // Transform members data for display
  readonly tableData = computed<MembersRow[]>(() => {
    const currentUserAuthorities = this.accountService.userAuthorities;
    const isEmployee = currentUserAuthorities?.includes(UserShortDTO.RolesEnum.Employee);

    return this.members().map((member): MembersRow => {
      const isCurrentUser = this.isCurrentUser(member);
      let canRemove = !isCurrentUser;

      if (isEmployee) {
        canRemove = false;
      }

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
        canRemove,
      };
    });
  });

  private researchGroupService = inject(ResearchGroupResourceApiService);
  private toastService = inject(ToastService);
  private accountService = inject(AccountService);
  private translate = inject(TranslateService);
  private readonly dialogService = inject(DialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Convert route observables to signals so we can create a derived computed signal
  private readonly routeParamMap = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly routeQueryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  private readonly routeId = computed<string | undefined>(() => {
    const params = this.routeParamMap();
    const queryParams = this.routeQueryParamMap();
    return params.get('id') ?? queryParams.get('researchGroupId') ?? undefined;
  });

  private readonly routeIdEffect = effect(() => {
    const id = this.routeId();
    this.researchGroupId.set(id);
    void this.loadMembers();
  });

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
      const id = this.researchGroupId();
      const members = id
        ? await firstValueFrom(this.researchGroupService.getResearchGroupMembersById(id, this.pageSize(), this.pageNumber()))
        : await firstValueFrom(this.researchGroupService.getResearchGroupMembers(this.pageSize(), this.pageNumber()));

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
      data: { researchGroupId: this.researchGroupId() },
    });

    ref?.onClose.subscribe((added: boolean) => {
      if (added) {
        void this.loadMembers();
      }
    });
  }

  goBack(): void {
    void this.router.navigate(['/research-group/admin-view']);
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

import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableLazyLoadEvent } from 'primeng/table';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DialogService } from 'primeng/dynamicdialog';
import { ResearchGroupShortDTO } from 'app/generated/model/research-group-short-dto';
import { UserShortDTO } from 'app/generated/model/user-short-dto';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';

import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ConfirmDialog } from '../../../shared/components/atoms/confirm-dialog/confirm-dialog';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { AccountService } from '../../../core/auth/account.service';
import {
  ResearchGroupResourceApi,
  getResearchGroupResource,
  getResearchGroupMembersResource,
  getResearchGroupMembersByIdResource,
  GetResearchGroupMembersParams,
  GetResearchGroupMembersByIdParams,
} from '../../../generated/api/research-group-resource-api';
import { formatFullName } from '../../../shared/util/name.util';
import { ResearchGroupAddMembersComponent } from '../research-group-add-members/research-group-add-members.component';

interface MembersRow {
  avatar?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  researchGroup?: ResearchGroupShortDTO;
  roles?: UserShortDTORolesEnum[];
  userId?: string;
  name: string;
  role: string;
  isCurrentUser: boolean;
  canRemove: boolean;
}

@Component({
  selector: 'jhi-research-group-members',
  imports: [
    BackButtonComponent,
    ButtonComponent,
    TranslateDirective,
    TranslateModule,
    DynamicTableComponent,
    DialogModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialog,
    UserAvatarComponent,
  ],
  templateUrl: './research-group-members.component.html',
})
export class ResearchGroupMembersComponent {
  pageNumber = signal<number>(0);
  pageSize = signal<number>(10);

  researchGroupId = signal<string | undefined>(undefined);

  // httpResource for members by ID (when researchGroupId is set)
  private readonly membersByIdParams = computed<GetResearchGroupMembersByIdParams>(() => ({
    pageSize: this.pageSize(),
    pageNumber: this.pageNumber(),
  }));
  private readonly researchGroupIdForResource = computed(() => this.researchGroupId() ?? '');
  private readonly membersByIdResource = getResearchGroupMembersByIdResource(this.researchGroupIdForResource, this.membersByIdParams);

  // httpResource for members (when no researchGroupId)
  private readonly membersParams = computed<GetResearchGroupMembersParams>(() => ({
    pageSize: this.pageSize(),
    pageNumber: this.pageNumber(),
  }));
  private readonly membersResource = getResearchGroupMembersResource(this.membersParams);

  // httpResource for research group name
  private readonly researchGroupNameResource = getResearchGroupResource(this.researchGroupIdForResource);
  researchGroupName = computed<string | undefined>(() => this.researchGroupNameResource.value()?.name);

  // Derived members/total from the appropriate resource
  members = computed<UserShortDTO[]>(() => {
    const data = this.researchGroupId() ? this.membersByIdResource.value() : this.membersResource.value();
    return data?.content ?? [];
  });
  total = computed<number>(() => {
    const data = this.researchGroupId() ? this.membersByIdResource.value() : this.membersResource.value();
    return data?.totalElements ?? 0;
  });

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
    return this.members().map((member): MembersRow => {
      const isCurrentUser = this.isCurrentUser(member);
      let canRemove = !isCurrentUser;

      if (this.isEmployee()) {
        canRemove = false;
      }

      return {
        email: member.email,
        avatar: member.avatar,
        firstName: member.firstName,
        lastName: member.lastName,
        researchGroup: member.researchGroup,
        roles: member.roles,
        userId: member.userId,
        name: formatFullName(member.firstName, member.lastName),
        role: this.formatRoles(member.roles),
        isCurrentUser,
        canRemove,
      };
    });
  });

  readonly isEmployee = computed(() => this.accountService.userAuthorities?.includes(UserShortDTORolesEnum.Employee) ?? false);

  private researchGroupApi = inject(ResearchGroupResourceApi);
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
  });

  private readonly translationKey: string = 'researchGroup.members';

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);
    this.pageSize.set(rows);
  }

  private reloadMembers(): void {
    if (this.researchGroupId()) {
      this.membersByIdResource.reload();
    } else {
      this.membersResource.reload();
    }
  }

  async removeMember(member: UserShortDTO): Promise<void> {
    try {
      await firstValueFrom(this.researchGroupApi.removeMemberFromResearchGroup(member.userId ?? ''));
      this.toastService.showSuccessKey(`${this.translationKey}.toastMessages.removeSuccess`, {
        memberName: formatFullName(member.firstName, member.lastName),
      });

      // Refresh the members list
      this.reloadMembers();
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.toastMessages.removeFailed`, {
        memberName: formatFullName(member.firstName, member.lastName),
      });
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
        this.reloadMembers();
      }
    });
  }

  /** Internal methods */

  private formatRoles(roles?: string[]): string {
    if (!roles?.length) {
      return this.translate.instant(`${this.translationKey}.noRole`);
    }

    return roles.map(role => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()).join(', ');
  }

  private isCurrentUser(member: UserShortDTO): boolean {
    return member.userId === this.accountService.userId;
  }
}

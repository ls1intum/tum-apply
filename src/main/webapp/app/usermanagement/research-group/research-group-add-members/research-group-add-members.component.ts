import { Component, computed, effect, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { KeycloakUserDTO } from 'app/generated/model/keycloak-user-dto';
import { ResearchGroupResourceApi } from 'app/generated/api/research-group-resource-api';
import { getAvailableUsersForResearchGroupResource, GetAvailableUsersForResearchGroupParams } from 'app/generated/api/user-resource-api';
import { lastValueFrom } from 'rxjs';
import { ToastService } from 'app/service/toast-service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxComponent } from 'app/shared/components/atoms/checkbox/checkbox.component';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';
import { formatFullName } from 'app/shared/util/name.util';

const I18N_BASE = 'researchGroup.members';
type UserListItem = KeycloakUserDTO & { displayName: string };

@Component({
  selector: 'jhi-research-group-add-members.component',
  imports: [
    TranslateModule,
    SearchFilterSortBar,
    ButtonComponent,
    FormsModule,
    PaginatorModule,
    ProgressSpinnerModule,
    CheckboxComponent,
    InfoBoxComponent,
    UserAvatarComponent,
  ],
  templateUrl: './research-group-add-members.component.html',
})
export class ResearchGroupAddMembersComponent {
  page = signal<number>(0);
  pageSize = signal<number>(10);
  loading = signal<boolean>(false);

  researchGroupId = computed(() => this.config.data?.researchGroupId as string | undefined);
  searchQuery = signal<string>('');

  // Only search when query meets minimum length
  private readonly effectiveSearchQuery = computed(() => {
    const query = this.searchQuery().trim();
    return query.length >= this.MIN_SEARCH_LENGTH ? query : undefined;
  });

  // httpResource for available users - auto-refetches when params change
  private readonly usersParams = computed<GetAvailableUsersForResearchGroupParams>(() => ({
    pageSize: this.pageSize(),
    pageNumber: this.page(),
    searchQuery: this.effectiveSearchQuery(),
  }));
  private readonly usersResource = getAvailableUsersForResearchGroupResource(this.usersParams);

  totalRecords = computed<number>(() => {
    if (this.effectiveSearchQuery() == null) return 0;
    return this.usersResource.value()?.totalElements ?? 0;
  });

  users = computed<UserListItem[]>(() => {
    if (this.effectiveSearchQuery() == null) return [];
    return this.toUserListItems(this.usersResource.value()?.content ?? []);
  });

  selectedUserCount = computed(() => this.selectedUsers().size);

  researchGroupApi = inject(ResearchGroupResourceApi);
  toastService = inject(ToastService);

  public readonly MIN_SEARCH_LENGTH = 3;

  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);

  private selectedUsers = signal<Map<string, KeycloakUserDTO>>(new Map());

  // Sync loading state from resource with delayed visibility
  private readonly LOADER_DELAY_MS = 250;
  private loaderTimeout: number | undefined;

  private readonly loadingEffect = effect(() => {
    const isLoading = this.usersResource.isLoading();
    if (isLoading) {
      if (this.loaderTimeout === undefined) {
        this.loaderTimeout = window.setTimeout(() => this.loading.set(true), this.LOADER_DELAY_MS);
      }
    } else {
      if (this.loaderTimeout !== undefined) {
        clearTimeout(this.loaderTimeout);
        this.loaderTimeout = undefined;
      }
      this.loading.set(false);
    }
  });

  onSearch(searchQuery: string): void {
    if (searchQuery !== this.searchQuery()) {
      this.page.set(0);
      this.searchQuery.set(searchQuery);
    }
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    const first = event.first;
    const rows = event.rows;
    const pageNumber = first != null && rows != null && rows !== 0 ? first / rows : 0;
    this.page.set(pageNumber);
    if (rows != null) {
      this.pageSize.set(rows);
    }
  }

  toggleUserSelection(user: KeycloakUserDTO): void {
    if (user.id == null || user.id === '') {
      this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.invalidUser`);
      return;
    }
    const currentMap = new Map(this.selectedUsers());
    const id = user.id;
    if (currentMap.has(id)) {
      currentMap.delete(id);
    } else {
      currentMap.set(id, user);
    }
    this.selectedUsers.set(currentMap);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onAddMembers(): Promise<void> {
    if (this.selectedUsers().size === 0) {
      return;
    }

    try {
      const researchGroupId = this.researchGroupId();

      const data = { keycloakUsers: Array.from(this.selectedUsers().values()), researchGroupId };
      await lastValueFrom(this.researchGroupApi.addMembersToResearchGroup(data));
      this.toastService.showSuccessKey(`${I18N_BASE}.toastMessages.addMembersSuccess`);
      this.dialogRef.close(true);
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        const rawMessage: unknown = err.error?.message;
        const errorMessage = typeof rawMessage === 'string' ? rawMessage : '';
        if (err.status === 400 && errorMessage.toLowerCase().includes('already a member')) {
          this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.addMembersFailedAlreadyMember`);
        } else if (err.status === 400 && errorMessage.toLowerCase().includes('not have a valid universityid')) {
          this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.addMembersFailedInvalidUniversityId`);
        } else {
          this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.addMembersFailed`);
        }
      } else {
        this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.addMembersFailed`);
      }
      this.dialogRef.close(false);
    }
  }

  isUserSelected(user: KeycloakUserDTO): boolean {
    if (user.id == null || user.id === '') {
      return false;
    }

    return this.selectedUsers().has(user.id);
  }

  private toUserListItems(users: KeycloakUserDTO[]): UserListItem[] {
    return users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      universityId: user.universityId,
      displayName: formatFullName(user.firstName, user.lastName),
    }));
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { SearchBar } from 'app/shared/components/molecules/search-bar/search-bar';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { UserDTO } from 'app/generated/model/userDTO';
import { ResearchGroupResourceApiService, UserResourceApiService } from 'app/generated';
import { lastValueFrom } from 'rxjs';
import { ToastService } from 'app/service/toast-service';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';

const I18N_BASE = 'researchGroup.members';

@Component({
  selector: 'jhi-research-group-add-members.component',
  imports: [CommonModule, TranslateModule, SearchBar, ButtonComponent, CheckboxModule, FormsModule, PaginatorModule, ConfirmDialog],
  templateUrl: './research-group-add-members.component.html',
})
export class ResearchGroupAddMembersComponent {
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);

  researchGroupId = computed(() => this.config.data?.researchGroupId as string | undefined);
  searchQuery = signal<string>('');

  users = signal<UserDTO[]>([]);
  selectedUserCount = computed(() => this.selectedUserIds().size);

  userService = inject(UserResourceApiService);
  researchGroupService = inject(ResearchGroupResourceApiService);
  toastService = inject(ToastService);

  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private selectedUserIds = signal<Set<string>>(new Set());

  constructor() {
    void this.loadAvailableUsers();
  }

  async loadAvailableUsers(searchQuery?: string): Promise<void> {
    try {
      const response = await lastValueFrom(this.userService.getAvailableUsersForResearchGroup(this.pageSize(), this.page(), searchQuery));
      this.totalRecords.set(response.totalElements ?? 0);
      this.users.set(response.content ?? []);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.loadUsersFailed`);
    }
  }

  onSearch(searchQuery: string): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      if (searchQuery !== this.searchQuery()) {
        this.page.set(0);
        this.searchQuery.set(searchQuery);
        void this.loadAvailableUsers(searchQuery);
      }
    }, 300);
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    const pageNumber = event.first && event.rows ? event.first / event.rows : 0;
    this.page.set(pageNumber);
    if (event.rows) {
      this.pageSize.set(event.rows);
    }
    void this.loadAvailableUsers(this.searchQuery() || undefined);
  }

  toggleUserSelection(user: UserDTO): void {
    const userId = user.userId;
    if (!userId) {
      this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.invalidUser`);
      return;
    }
    const currentSet = new Set(this.selectedUserIds());

    if (currentSet.has(userId)) {
      currentSet.delete(userId);
    } else {
      currentSet.add(userId);
    }

    this.selectedUserIds.set(currentSet);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onAddMembers(): Promise<void> {
    const userIds = Array.from(this.selectedUserIds());
    const researchGroupId = this.researchGroupId();

    if (userIds.length === 0) {
      return;
    }

    try {
      await lastValueFrom(this.researchGroupService.addMembersToResearchGroup({ userIds, researchGroupId }));
      this.toastService.showSuccessKey(`${I18N_BASE}.toastMessages.addMembersSuccess`);
      this.dialogRef.close(true);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.addMembersFailed`);
      this.dialogRef.close(false);
    }
  }

  isUserSelected(user: UserDTO): boolean {
    const userId = user.userId;
    if (!userId) {
      return false; // Return false if userId is undefined
    }

    return this.selectedUserIds().has(userId);
  }
}

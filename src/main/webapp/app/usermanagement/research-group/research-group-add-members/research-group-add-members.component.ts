import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { UserDTO } from 'app/generated/model/userDTO';
import { ResearchGroupResourceApiService, UserResourceApiService } from 'app/generated';
import { lastValueFrom } from 'rxjs';
import { ToastService } from 'app/service/toast-service';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';

const I18N_BASE = 'researchGroup.members';

@Component({
  selector: 'jhi-research-group-add-members.component',
  imports: [
    CommonModule,
    TranslateModule,
    SearchFilterSortBar,
    ButtonComponent,
    CheckboxModule,
    FormsModule,
    PaginatorModule,
    ConfirmDialog,
  ],
  templateUrl: './research-group-add-members.component.html',
})
export class ResearchGroupAddMembersComponent {
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);
  loading = signal<boolean>(false);

  researchGroupId = computed(() => this.config.data?.researchGroupId as string | undefined);
  searchQuery = signal<string>('');

  users = signal<UserDTO[]>([]);
  selectedUserCount = computed(() => this.selectedUserIds().size);

  userService = inject(UserResourceApiService);
  researchGroupService = inject(ResearchGroupResourceApiService);
  toastService = inject(ToastService);

  public readonly MIN_SEARCH_LENGTH = 3;

  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  // Delay before showing the loading spinner to avoid flickering on fast queries
  private readonly LOADER_DELAY_MS = 250;
  private loaderTimeout: number | null = null;
  private selectedUserIds = signal<Set<string>>(new Set());

  constructor() {
    void this.loadAvailableUsers();
  }

  /**
   * Loads the available users for the research group based on the provided search query.
   * This method handles debouncing, manages a loading spinner, and updates the user list
   * and total record count based on the response from the user service.
   *
   * @param searchQuery - An optional string representing the search query to filter users.
   *                      If not provided, the current search query is used.
   *
   * @returns A promise that resolves when the operation is complete.
   *
   * Behavior:
   * - If the search query is empty and there are existing users, the user list and total
   *   record count are cleared.
   * - If the search query is empty and there are no users, the method exits early.
   * - If the search query is shorter than the minimum search length, the method exits early.
   * - A loading spinner is displayed after a delay while the user data is being fetched.
   * - Ensures that the loading spinner is hidden and any pending timers are cleared.
   */
  async loadAvailableUsers(searchQuery?: string): Promise<void> {
    const rawQuery = searchQuery ?? this.searchQuery();
    const query = rawQuery.trim();

    if (query === '' && this.users().length > 0) {
      this.users.set([]);
      this.totalRecords.set(0);
      return;
    }

    if (query === '' && this.users().length === 0) {
      return;
    }

    if (query !== '' && query.length < this.MIN_SEARCH_LENGTH) {
      return;
    }

    if (this.loaderTimeout) {
      clearTimeout(this.loaderTimeout);
      this.loaderTimeout = null;
    }
    this.loaderTimeout = window.setTimeout(() => this.loading.set(true), this.LOADER_DELAY_MS);

    try {
      const response = await lastValueFrom(
        this.userService.getAvailableUsersForResearchGroup(this.pageSize(), this.page(), query || undefined),
      );
      this.totalRecords.set(response.totalElements ?? 0);
      this.users.set(response.content ?? []);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.loadUsersFailed`);
    } finally {
      // clear pending timer and ensure spinner is hidden
      if (this.loaderTimeout) {
        clearTimeout(this.loaderTimeout);
        this.loaderTimeout = null;
      }
      this.loading.set(false);
    }
  }

  onSearch(searchQuery: string): void {
    if (searchQuery !== this.searchQuery()) {
      this.page.set(0);
      this.searchQuery.set(searchQuery);
      void this.loadAvailableUsers(searchQuery);
    }
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
      return false;
    }

    return this.selectedUserIds().has(userId);
  }
}

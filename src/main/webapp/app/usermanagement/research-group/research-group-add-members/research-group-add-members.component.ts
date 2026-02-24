import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { KeycloakUserDTO, ResearchGroupResourceApiService, UserResourceApiService } from 'app/generated';
import { lastValueFrom } from 'rxjs';
import { ToastService } from 'app/service/toast-service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxComponent } from 'app/shared/components/atoms/checkbox/checkbox.component';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';

const I18N_BASE = 'researchGroup.members';

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

  users = signal<KeycloakUserDTO[]>([]);
  selectedUserCount = computed(() => this.selectedUsers().size);

  userService = inject(UserResourceApiService);
  researchGroupService = inject(ResearchGroupResourceApiService);
  http = inject(HttpClient);
  toastService = inject(ToastService);

  public readonly MIN_SEARCH_LENGTH = 3;

  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);

  // Delay before showing the loading spinner to avoid flickering on fast queries
  private readonly LOADER_DELAY_MS = 250;
  private loaderTimeout: number | null = null;

  // Local mock users for UI testing without Keycloak/server
  private readonly USE_MOCK_USERS = window.location.hostname === 'localhost';
  private mockUsers = signal<KeycloakUserDTO[] | null>(null);
  private readonly MOCK_USERS_PATH = '/content/mock/keycloak-users.json';

  private latestRequestId = 0;
  private selectedUsers = signal<Map<string, KeycloakUserDTO>>(new Map());

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

    if (this.USE_MOCK_USERS) {
      const mockUsers = await this.loadMockUsers();
      const normalizedQuery = query.toLowerCase();
      const filteredUsers = normalizedQuery
        ? mockUsers.filter(user =>
            `${user.firstName ?? ''} ${user.lastName ?? ''} ${user.email ?? ''}`.toLowerCase().includes(normalizedQuery),
          )
        : mockUsers;

      const startIndex = this.page() * this.pageSize();
      const endIndex = startIndex + this.pageSize();
      this.totalRecords.set(filteredUsers.length);
      this.users.set(filteredUsers.slice(startIndex, endIndex));
      return;
    }

    if (this.loaderTimeout) {
      clearTimeout(this.loaderTimeout);
      this.loaderTimeout = null;
    }
    this.loaderTimeout = window.setTimeout(() => this.loading.set(true), this.LOADER_DELAY_MS);

    // ensure we only apply the latest response
    const requestId = ++this.latestRequestId;

    try {
      const response = await lastValueFrom(this.userService.getAvailableUsersForResearchGroup(this.pageSize(), this.page(), query));
      // If another newer request has been started, ignore the response of this (stale) one
      if (requestId !== this.latestRequestId) {
        return;
      }
      this.totalRecords.set(response.totalElements ?? 0);
      this.users.set(response.content ?? []);
    } catch {
      // Only show an error toast for the most recent request; stale errors shouldn't alarm the user
      if (requestId === this.latestRequestId) {
        this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.loadUsersFailed`);
      }
    } finally {
      // only touch loading/timeout if this is the latest request
      if (requestId === this.latestRequestId) {
        if (this.loaderTimeout) {
          clearTimeout(this.loaderTimeout);
          this.loaderTimeout = null;
        }
        this.loading.set(false);
      }
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

  toggleUserSelection(user: KeycloakUserDTO): void {
    if (!user.id) {
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
      await lastValueFrom(this.researchGroupService.addMembersToResearchGroup(data));
      this.toastService.showSuccessKey(`${I18N_BASE}.toastMessages.addMembersSuccess`);
      this.dialogRef.close(true);
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        const errorMessage = err.error?.message ?? '';
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
    if (!user.id) {
      return false;
    }

    return this.selectedUsers().has(user.id);
  }

  private async loadMockUsers(): Promise<KeycloakUserDTO[]> {
    const cachedUsers = this.mockUsers();
    if (cachedUsers !== null) {
      return cachedUsers;
    }

    try {
      const users = await lastValueFrom(this.http.get<KeycloakUserDTO[]>(this.MOCK_USERS_PATH));
      this.mockUsers.set(users);
      return users;
    } catch {
      this.mockUsers.set([]);
      this.toastService.showErrorKey(`${I18N_BASE}.toastMessages.loadUsersFailed`);
      return [];
    }
  }
}

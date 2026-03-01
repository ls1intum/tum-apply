import { Component, computed, inject, signal } from '@angular/core';
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
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';

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
    UserAvatarComponent,
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
  toastService = inject(ToastService);

  public readonly MIN_SEARCH_LENGTH = 3;

  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);

  // Delay before showing the loading spinner to avoid flickering on fast queries
  private readonly LOADER_DELAY_MS = 250;
  private loaderTimeout: number | null = null;

  // Local mock users for UI testing without Keycloak/server
  private readonly USE_MOCK_USERS = window.location.hostname === 'localhost';
  private readonly MOCK_USERS: KeycloakUserDTO[] = [
    {
      id: '7a6b8f3a-09f4-4e9f-8d09-2e2d1a1d8a01',
      firstName: 'Aniruddh',
      lastName: 'Zaveri',
      email: 'aniruddh.zaveri@tum.de',
      universityId: 'ab12asd',
    },
    {
      id: '2c9c3d14-1a5b-4a8f-9c21-4b1d9e2a3f02',
      firstName: 'Aniruddh',
      lastName: 'Pawar',
      email: 'ge69hug@mytum.de',
      universityId: 'ab12adv',
    },
    {
      id: 'e4b2f1c3-5d6e-4f1a-8b9c-3d4e5f6a7b03',
      firstName: 'Alice',
      lastName: 'Curie',
      email: 'alice.curie@tum.de',
      universityId: 'ab12agf',
    },
    {
      id: 'f5a6b7c8-9d0e-4f1a-8b2c-3d4e5f6a7b04',
      firstName: 'Ben',
      lastName: 'Schmidt',
      email: 'ben.schmidt@mytum.de',
      universityId: 'ab12gkl',
    },
    {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c05',
      firstName: 'Carla',
      lastName: 'Nguyen',
      email: 'carla.nguyen@tum.de',
      universityId: 'ab12hij',
    },
    {
      id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d06',
      firstName: 'David',
      lastName: 'Ibrahim',
      email: 'david.ibrahim@mytum.de',
      universityId: 'ab12klm',
    },
    {
      id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e07',
      firstName: 'Elena',
      lastName: 'Rossi',
      email: 'elena.rossi@tum.de',
      universityId: 'ab12nop',
    },
    {
      id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f08',
      firstName: 'Farid',
      lastName: 'Khan',
      email: 'farid.khan@mytum.de',
      universityId: 'ab12qrs',
    },
    {
      id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a09',
      firstName: 'Greta',
      lastName: 'Meyer',
      email: 'greta.meyer@tum.de',
      universityId: 'ab12tuv',
    },
    {
      id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b10',
      firstName: 'Hugo',
      lastName: 'Weiss',
      email: 'hugo.weiss@mytum.de',
      universityId: 'ab12wxy',
    },
    {
      id: '0a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c11',
      firstName: 'Isabella',
      lastName: 'Fischer',
      email: 'isabella.fischer@tum.de',
      universityId: 'ab12zab',
    },
    {
      id: '1b2c3d4e-5f6a-4b7c-9d0e-1f2a3b4c5d12',
      firstName: 'Jonas',
      lastName: 'Bauer',
      email: 'jonas.bauer@mytum.de',
      universityId: 'ab12cde',
    },
  ];

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
      const normalizedQuery = query.toLowerCase();
      const filteredUsers = normalizedQuery
        ? this.MOCK_USERS.filter(user =>
            `${user.firstName ?? ''} ${user.lastName ?? ''} ${user.email ?? ''}`.toLowerCase().includes(normalizedQuery),
          )
        : this.MOCK_USERS;

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
}

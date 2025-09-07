import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { ResearchGroupResourceService } from '../../../generated/api/researchGroupResource.service';
import { UserShortDTO } from '../../../generated/model/userShortDTO';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { AccountService } from '../../../core/auth/account.service';
import { SearchFilterSortBar } from '../../../shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';

interface SearchableUser extends UserShortDTO {
  isSelected?: boolean;
}

@Component({
  selector: 'jhi-research-group-members',
  imports: [
    TranslateDirective,
    FontAwesomeModule,
    TranslateModule,
    SearchFilterSortBar,
    ButtonComponent,
    DialogModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './research-group-members.component.html',
  styleUrl: './research-group-members.component.scss',
})
export class ResearchGroupMembersComponent {
  members = signal<UserShortDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');

  // Modal state
  modalVisible = signal(false);
  modalSearchQuery = signal('');
  selectedUsers = signal<SearchableUser[]>([]);
  searchResults = signal<SearchableUser[]>([]);

  // Computed filtered members based on search query
  filteredMembers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allMembers = this.members();

    if (!query) {
      return allMembers;
    }

    return allMembers.filter(
      member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) ||
        (member.email?.toLowerCase().includes(query) ?? false) ||
        (member.roles?.some(role => role.toLowerCase().includes(query)) ?? false),
    );
  });

  private researchGroupService = inject(ResearchGroupResourceService);
  private toastService = inject(ToastService);
  private accountService = inject(AccountService);

  constructor() {
    void this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const members = await firstValueFrom(this.researchGroupService.getResearchGroupMembers());
      this.members.set(members);
    } catch (error) {
      console.error('Error loading research group members:', error);
      this.error.set('Failed to load research group members');
      this.toastService.showError({ detail: 'Failed to load research group members' });
    } finally {
      this.loading.set(false);
    }
  }

  formatRoles(roles?: string[]): string {
    if (!roles || roles.length === 0) {
      return 'No role';
    }

    // Capitalize first letter and make it singular
    return roles[0].charAt(0).toUpperCase() + roles[0].slice(1).toLowerCase();
  }

  isCurrentUser(member: UserShortDTO): boolean {
    return member.userId === this.accountService.userId;
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  addMember(): void {
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
    this.modalSearchQuery.set('');
    this.selectedUsers.set([]);
    this.searchResults.set([]);
  }

  onModalSearch(query: string): void {
    this.modalSearchQuery.set(query);
    void this.performUserSearch(query);
  }

  toggleUserSelection(user: SearchableUser): void {
    const currentResults = this.searchResults();
    const updatedResults = currentResults.map(u => (u.userId === user.userId ? { ...u, isSelected: !(u.isSelected ?? false) } : u));
    this.searchResults.set(updatedResults);

    // Update selected users list
    const selectedUsers = updatedResults.filter(u => Boolean(u.isSelected));
    this.selectedUsers.set(selectedUsers);
  }

  addSelectedUsersToGroup(): void {
    const selectedUsers = this.selectedUsers();
    if (selectedUsers.length === 0) {
      return;
    }

    // TODO: Implement actual API call to add users to research group
    this.toastService.showSuccess({
      detail: `Successfully added to the research group.`,
    });

    // Close modal and reset state
    this.closeModal();

    // TODO: Refresh the members list after successful addition
    // await this.loadMembers();
  }

  editMember(member: UserShortDTO): void {
    // TODO: Implement edit or delete functionality
    this.toastService.showInfo({
      detail: `Edit functionality for ${member.firstName} ${member.lastName} will be implemented soon.`,
    });
  }

  private async performUserSearch(query: string): Promise<void> {
    if (!query.trim()) {
      this.searchResults.set([]);
      return;
    }

    try {
      const results = await firstValueFrom(this.researchGroupService.searchAvailableUsers(query));
      this.searchResults.set(results.map(user => ({ ...user, isSelected: false })));
    } catch (error) {
      console.error('Error searching for users:', error);
      this.searchResults.set([]);
    }
  }
}

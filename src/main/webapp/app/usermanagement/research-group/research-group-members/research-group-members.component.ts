import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { ResearchGroupResourceService } from '../../../generated/api/researchGroupResource.service';
import { UserShortDTO } from '../../../generated/model/userShortDTO';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { AccountService } from '../../../core/auth/account.service';
import { SearchFilterSortBar } from '../../../shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-research-group-members',
  imports: [TranslateDirective, FontAwesomeModule, TranslateModule, SearchFilterSortBar, ButtonComponent],
  templateUrl: './research-group-members.component.html',
  styleUrl: './research-group-members.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchGroupMembersComponent {
  members = signal<UserShortDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');

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

  editMember(member: UserShortDTO): void {
    // TODO: Implement edit functionality
    this.toastService.showInfo({
      detail: `Edit functionality for ${member.firstName} ${member.lastName} will be implemented soon.`,
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  addMember(): void {
    // TODO: Implement add member functionality
    this.toastService.showInfo({
      detail: 'Add member functionality will be implemented soon.',
    });
  }
}

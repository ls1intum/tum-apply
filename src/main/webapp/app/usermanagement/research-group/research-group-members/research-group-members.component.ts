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

import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ConfirmDialog } from '../../../shared/components/atoms/confirm-dialog/confirm-dialog';
import { ResearchGroupResourceService } from '../../../generated/api/researchGroupResource.service';
import { UserShortDTO } from '../../../generated/model/userShortDTO';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { AccountService } from '../../../core/auth/account.service';
import { SearchFilterSortBar } from '../../../shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-research-group-members',
  imports: [
    TranslateDirective,
    FontAwesomeModule,
    TranslateModule,
    DynamicTableComponent,
    SearchFilterSortBar,
    ButtonComponent,
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
  loading = signal(false);
  searchQuery = signal('');

  // Modal state
  modalVisible = signal(false);

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
    return this.filteredMembers().map(member => ({
      ...member,
      name: `${member.firstName} ${member.lastName}`,
      role: this.formatRoles(member.roles),
      isCurrentUser: this.isCurrentUser(member),
    }));
  });

  private researchGroupService = inject(ResearchGroupResourceService);
  private toastService = inject(ToastService);
  private accountService = inject(AccountService);
  private translate = inject(TranslateService);

  private readonly translationKey: string = 'researchGroup.members';

  constructor() {
    void this.loadMembers();
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);

    void this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    try {
      const members = await firstValueFrom(this.researchGroupService.getResearchGroupMembers(this.pageSize(), this.pageNumber()));

      this.members.set(members.content ?? []);
      this.total.set(members.totalElements ?? 0);
    } catch {
      this.toastService.showError({ detail: 'Failed to load research group members' });
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
  }

  addSelectedUsersToGroup(): void {
    // TODO: Implement actual API call to add users to research group
    this.toastService.showSuccess({
      detail: `Successfully added to the research group.`,
    });

    // Close modal and reset state
    this.closeModal();

    // TODO: Refresh the members list after successful addition
    // await this.loadMembers();
  }

  async removeMember(member: UserShortDTO): Promise<void> {
    try {
      // Call the generated service method to remove the member from the research group
      await firstValueFrom(this.researchGroupService.removeMemberFromResearchGroup(member.userId ?? ''));

      this.toastService.showSuccess({
        detail: `${member.firstName} ${member.lastName} has been removed from the research group.`,
      });

      // Refresh the members list
      await this.loadMembers();
    } catch {
      this.toastService.showError({
        detail: `Failed to remove ${member.firstName} ${member.lastName} from the research group.`,
      });
    }
  }
}

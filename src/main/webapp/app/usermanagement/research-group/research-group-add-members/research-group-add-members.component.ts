import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { SearchBar } from 'app/shared/components/molecules/search-bar/search-bar';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { UserDTO } from 'app/generated/model/userDTO';
import { UserResourceApiService } from 'app/generated';
import { lastValueFrom } from 'rxjs';

interface UserSelection {
  user: UserDTO;
  selected: boolean;
}

@Component({
  selector: 'jhi-research-group-add-members.component',
  imports: [CommonModule, TranslateModule, SearchBar, ButtonComponent, CheckboxModule, FormsModule],
  templateUrl: './research-group-add-members.component.html',
})
export class ResearchGroupAddMembersComponent {
  searchQuery = signal<string>('');
  userSelections = signal<UserSelection[]>([]);
  userService = inject(UserResourceApiService);

  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);

  constructor() {
    this.loadAvailableUsers();
  }

  async loadAvailableUsers(searchQuery?: string): Promise<void> {
    const users = await lastValueFrom(this.userService.getAvailableUsersForResearchGroup(searchQuery));
    this.userSelections.set(users.map(user => ({ user, selected: false })));
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.loadAvailableUsers(query || undefined);
  }

  get selectedUsers(): UserDTO[] {
    return this.userSelections()
      .filter(selection => selection.selected)
      .map(selection => selection.user);
  }

  get filteredUserSelections(): UserSelection[] {
    return this.userSelections();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAddMembers(): void {
    this.dialogRef.close(this.selectedUsers);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { SearchBar } from 'app/shared/components/molecules/search-bar/search-bar';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { UserDTO } from 'app/generated/model/userDTO';

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

  // Mock data - replace with actual API call
  availableUsers: UserDTO[] = [
    { userId: '1', firstName: 'Sofia', lastName: 'Ricci', email: 'sofia.ricci@tum.de' },
    { userId: '2', firstName: 'Ines', lastName: 'Fernandez', email: 'ines.fernandez@tum.de' },
    { userId: '3', firstName: 'Elena', lastName: 'Kovalenko', email: 'elena.kovalenko@tum.de' },
    { userId: '4', firstName: 'Hassan', lastName: 'Mohammed', email: 'hassan.mohammed@tum.de' },
  ];

  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);

  constructor() {
    this.userSelections.set(this.availableUsers.map(user => ({ user, selected: false })));
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  get selectedUsers(): UserDTO[] {
    return this.userSelections()
      .filter(selection => selection.selected)
      .map(selection => selection.user);
  }

  get filteredUserSelections(): UserSelection[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.userSelections();
    }

    return this.userSelections().filter(selection => {
      const user = selection.user;
      return (
        (user.firstName?.toLowerCase().includes(query) ?? false) ||
        (user.lastName?.toLowerCase().includes(query) ?? false) ||
        (user.email?.toLowerCase().includes(query) ?? false)
      );
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAddMembers(): void {
    this.dialogRef.close(this.selectedUsers);
  }
}

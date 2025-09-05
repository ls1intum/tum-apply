import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ResearchGroupResourceService } from '../../../generated/api/researchGroupResource.service';
import { UserShortDTO } from '../../../generated/model/userShortDTO';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';

@Component({
  selector: 'jhi-research-group-members',
  imports: [TranslateDirective],
  templateUrl: './research-group-members.component.html',
  styleUrl: './research-group-members.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchGroupMembersComponent {
  protected readonly members = signal<UserShortDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly researchGroupService = inject(ResearchGroupResourceService);
  private readonly toastService = inject(ToastService);

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

  protected formatRoles(roles?: string[]): string {
    if (!roles || roles.length === 0) {
      return 'No role';
    }

    // Capitalize first letter and make it singular
    return roles[0].charAt(0).toUpperCase() + roles[0].slice(1).toLowerCase();
  }

  protected editMember(member: UserShortDTO): void {
    // TODO: Implement edit functionality
    this.toastService.showInfo({
      detail: `Edit functionality for ${member.firstName} ${member.lastName} will be implemented soon.`,
    });
  }
}

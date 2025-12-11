import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { ResearchGroupRemoveMembersComponent } from '../research-group-remove-members/research-group-remove-members.component';
import { ResearchGroupAddMembersComponent } from '../../research-group-add-members/research-group-add-members.component';

@Component({
  selector: 'jhi-manage-members-choice.component',
  imports: [ButtonComponent, TranslateModule],
  templateUrl: './manage-members-choice.component.html',
})
export class ManageMembersChoiceComponent {
  researchGroupId = computed(() => this.config.data?.researchGroupId as string | undefined);
  hasMembers = signal<boolean>(true);
  canAddMembers = signal<boolean>(true);
  loading = signal<boolean>(false);

  private readonly config = inject(DynamicDialogConfig);
  private readonly dialogService = inject(DialogService);
  private readonly translate = inject(TranslateService);

  openRemoveMembersDialog(): void {
    this.dialogService.open(ResearchGroupRemoveMembersComponent, {
      header: this.translate.instant('researchGroup.members.removeMembers'),
      data: { researchGroupId: this.researchGroupId() },
      style: { background: 'var(--color-background-default)', width: '60rem', maxWidth: '60rem' },
      draggable: false,
      closable: true,
      modal: true,
    });
  }

  openAddMembersDialog(): void {
    this.dialogService.open(ResearchGroupAddMembersComponent, {
      header: this.translate.instant('researchGroup.members.addMembers'),
      data: { researchGroupId: this.researchGroupId() },
      style: { background: 'var(--color-background-default)', width: '60rem', maxWidth: '60rem' },
      draggable: false,
      closable: true,
      modal: true,
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DividerModule } from 'primeng/divider';
import { DescriptionList } from 'app/shared/components/atoms/description-list/description-list';
import { Prose } from 'app/shared/components/atoms/prose/prose';
import { Section } from 'app/shared/components/atoms/section/section';
import { SubSection } from 'app/shared/components/atoms/sub-section/sub-section';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { ToastService } from 'app/service/toast-service';
import { TranslateDirective } from 'app/shared/language';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'jhi-research-group-detail-view.component',
  imports: [TranslateModule, TranslateDirective, Section, SubSection, DescriptionList, Prose, DividerModule],
  templateUrl: './research-group-detail-view.component.html',
  styleUrl: './research-group-detail-view.component.scss',
})
export class ResearchGroupDetailViewComponent {
  researchGroup = signal<ResearchGroupDTO | null>(null);

  readonly ResearchGroupService = inject(ResearchGroupResourceApiService);
  private readonly config = inject(DynamicDialogConfig);
  private toastService = inject(ToastService);

  constructor() {
    const researchGroupId = this.config.data?.researchGroupId as string;
    if (researchGroupId) {
      void this.loadResearchGroup(researchGroupId);
    }
  }

  private async loadResearchGroup(researchGroupId: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.ResearchGroupService.getResearchGroup(researchGroupId));
      this.researchGroup.set(data);
    } catch {
      this.toastService.showErrorKey('researchGroup.adminView.errors.view');
    }
  }
}

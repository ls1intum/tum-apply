import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateService } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';

import { ApplicationDetailDTO } from '../../../../generated/model/application-detail-dto';

@Component({
  selector: 'jhi-application-detail-card',
  imports: [FontAwesomeModule, NgTemplateOutlet, TranslateDirective],
  templateUrl: './application-detail-card.component.html',
  styleUrl: './application-detail-card.component.scss',
})
export class ApplicationDetailCardComponent {
  application = input.required<ApplicationDetailDTO>();

  motivationLabel = computed(() => this.translate('entity.applicationDetail.motivation'));
  skillsLabel = computed(() => this.translate('entity.applicationDetail.skills'));
  researchExperienceLabel = computed(() => this.translate('entity.applicationDetail.researchExperience'));

  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  private translate(key: string): string {
    this.langChange();
    return this.translateService.instant(key);
  }
}

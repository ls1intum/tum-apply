import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageModule } from 'primeng/message';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';
import { ProfOnboardingResourceApiService } from '../../../../generated/api/profOnboardingResourceApi.service';

/**
 * Professor onboarding dialog.
 */
@Component({
  selector: 'jhi-onboarding-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslateModule, ButtonComponent, TranslateDirective, MessageModule],
  templateUrl: './onboarding-dialog.html',
  styleUrls: ['./onboarding-dialog.scss'],
})
export class OnboardingDialog {
  private readonly ref = inject(DynamicDialogRef, { optional: true });
  private readonly api = inject(ProfOnboardingResourceApiService);
  private readonly translate = inject(TranslateService);

  private static buildMailto(translate: TranslateService): string {
    const subject = translate.instant('onboarding.email.subject');
    const body = translate.instant('onboarding.email.body');
    return `mailto:TUMApply Support <support-tum-apply.aet@xcit.tum.de>?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  markOnboarded(openEmail = true): void {
    if (openEmail) {
      window.location.href = OnboardingDialog.buildMailto(this.translate);
    }
    void firstValueFrom(this.api.confirmOnboarding()).catch();
    this.ref?.close();
  }
}

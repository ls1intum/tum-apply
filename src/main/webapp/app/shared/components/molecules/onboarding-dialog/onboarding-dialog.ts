import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, firstValueFrom } from 'rxjs';

import { ProfOnboardingResourceService } from '../../../../generated';
import { ButtonComponent } from '../../atoms/button/button.component';

/**
 * Professor onboarding dialog.
 */
@Component({
  selector: 'jhi-onboarding-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslateModule, ButtonComponent],
  templateUrl: './onboarding-dialog.html',
  styleUrl: './onboarding-dialog.scss',
})
export class OnboardingDialog {
  static readonly DOCS_URL = '/tum-apply/docs/professors/account-creation';
  // Prefilled mailto link
  static readonly MAILTO =
    `mailto:support-tum-apply.aet@xcit.tum.de?subject=${encodeURIComponent('Request for Research Group creation')}` +
    `&body=${encodeURIComponent('Research Group name:\n' + 'Head of Research Group (name + title):\n' + '(optional) Further details:\n')}`;
  readonly docsUrl = OnboardingDialog.DOCS_URL;
  ref = input<DynamicDialogRef | null>(null);
  private api = inject(ProfOnboardingResourceService);

  markOnboarded(): void {
    this.handleApiCall(this.api.confirmOnboarding());
  }

  /** Optional: User clicked "Remind me later": set onboarded=false. */
  remindLater(): void {
    this.handleApiCall(this.api.remindLater());
  }

  private handleApiCall(apiCall: Observable<any>): void {
    firstValueFrom(apiCall)
      .then(() => {
        this.ref()?.close();
      })
      .catch(() => this.ref()?.close());
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageModule } from 'primeng/message';
import { firstValueFrom } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';

import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';
import { ProfOnboardingResourceApiService } from '../../../../generated/api/profOnboardingResourceApi.service';

import { ProfessorRequestAccessFormComponent } from './professor-request-access-form-component.ts/professor-request-access-form/professor-request-access-form.component';

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
  private readonly dialogService = inject(DialogService);

  markOnboarded(openEmail = true): void {
    if (openEmail) {
      this.ref?.close();

      this.dialogService.open(ProfessorRequestAccessFormComponent, {
        header: this.translate.instant('onboarding.professorRequest.dialogTitle'),
        modal: true,
        closable: true,
        dismissableMask: false,
        width: '900px',
        style: {
          'max-width': '95vw',
          'background-color': 'white',
          'border-radius': '8px',
        },
        focusOnShow: false,
      });
    }
    void firstValueFrom(this.api.confirmOnboarding()).catch();
    this.ref?.close();
  }
}

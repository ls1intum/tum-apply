import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageModule } from 'primeng/message';
import { firstValueFrom } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { ONBOARDING_FORM_DIALOG_CONFIG } from 'app/shared/constants/onboarding-dialog.constants';

import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';
import { ProfOnboardingResourceApiService } from '../../../../generated/api/profOnboardingResourceApi.service';

import { ProfessorRequestAccessFormComponent } from './professor-request-access-form/professor-request-access-form.component';
import { EmployeeRequestAccessFormComponent } from './employee-request-access-form/employee-request-access-form.component';

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

  markOnboarded(openForm = true): void {
    if (openForm) {
      this.ref?.close();

      this.dialogService.open(ProfessorRequestAccessFormComponent, {
        ...ONBOARDING_FORM_DIALOG_CONFIG,
        header: this.translate.instant('onboarding.professorRequest.dialogTitle'),
      });
    } else {
      void firstValueFrom(this.api.confirmOnboarding()).catch();
      this.ref?.close();
    }
  }

  openEmployeeForm(): void {
    this.ref?.close();

    this.dialogService.open(EmployeeRequestAccessFormComponent, {
      ...ONBOARDING_FORM_DIALOG_CONFIG,
      header: this.translate.instant('onboarding.employeeRequest.dialogTitle'),
    });
  }
}

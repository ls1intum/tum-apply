import { Component, inject } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { EmployeeRequestAccessFormComponent } from 'app/shared/components/molecules/onboarding-dialog/employee-request-access-form/employee-request-access-form.component';
import { ONBOARDING_FORM_DIALOG_CONFIG } from 'app/shared/constants/onboarding-dialog.constants';
import { DialogService } from 'primeng/dynamicdialog';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-professor-faq-section',
  imports: [AccordionModule, TranslateModule, TranslateDirective, FontAwesomeModule, ButtonComponent],
  templateUrl: './professor-faq-section.component.html',
  styleUrl: './professor-faq-section.component.scss',
})
export class ProfessorFaqSectionComponent {
  readonly translationKey = 'professorLandingPage.faq.questions';
  tabs = [
    {
      value: 'registration',
      title: `${this.translationKey}.registration.title`,
      content: `${this.translationKey}.registration.content`,
    },
    {
      value: 'login',
      title: `${this.translationKey}.login.title`,
      content: `${this.translationKey}.login.content`,
    },
    {
      value: 'multiple-applications',
      title: `${this.translationKey}.multipleApplications.title`,
      content: `${this.translationKey}.multipleApplications.content`,
    },
    {
      value: 'documents',
      title: `${this.translationKey}.documents.title`,
      content: `${this.translationKey}.documents.content`,
    },
    {
      value: 'status',
      title: `${this.translationKey}.status.title`,
      content: `${this.translationKey}.status.content`,
    },
  ];
  readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  private readonly translate = inject(TranslateService);
  private readonly dialogService = inject(DialogService);

  openRegistrationForm(): void {
    this.dialogService.open(EmployeeRequestAccessFormComponent, {
      ...ONBOARDING_FORM_DIALOG_CONFIG,
      header: this.translate.instant('onboarding.employeeRequest.dialogTitle'),
    });
  }
}

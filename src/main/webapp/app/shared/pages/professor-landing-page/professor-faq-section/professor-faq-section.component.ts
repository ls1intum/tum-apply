import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-professor-faq-section',
  imports: [AccordionModule, TranslateModule, TranslateDirective, FontAwesomeModule],
  templateUrl: './professor-faq-section.component.html',
  styleUrl: './professor-faq-section.component.scss',
})
export class ProfessorFaqSectionComponent {
  readonly translationKey = 'professorLandingPage.faq.questions';

  tabs = [
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
}

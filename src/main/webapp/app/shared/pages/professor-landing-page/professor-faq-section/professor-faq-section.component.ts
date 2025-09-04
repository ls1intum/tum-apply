import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-professor-faq-section',
  imports: [AccordionModule, TranslateModule, TranslateDirective],
  templateUrl: './professor-faq-section.component.html',
  styleUrl: './professor-faq-section.component.scss',
})
export class ProfessorFaqSectionComponent {
  tabs = [
    {
      value: 'login',
      title: 'professorLandingPage.faq.questions.login.title',
      content: 'professorLandingPage.faq.questions.login.content',
    },
    {
      value: 'multiple-applications',
      title: 'professorLandingPage.faq.questions.multipleApplications.title',
      content: 'professorLandingPage.faq.questions.multipleApplications.content',
    },
    {
      value: 'documents',
      title: 'professorLandingPage.faq.questions.documents.title',
      content: 'professorLandingPage.faq.questions.documents.content',
    },
    {
      value: 'status',
      title: 'professorLandingPage.faq.questions.status.title',
      content: 'professorLandingPage.faq.questions.status.content',
    },
  ];
}

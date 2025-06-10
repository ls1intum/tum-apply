import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-faq-section',
  standalone: true,
  imports: [AccordionModule, TranslateModule],
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss',
})
export class FaqSectionComponent {
  tabs = [
    {
      value: 'login',
      title: 'landingPage.faq.questions.login.title',
      content: 'landingPage.faq.questions.login.content',
    },
    {
      value: 'multiple-applications',
      title: 'landingPage.faq.questions.multipleApplications.title',
      content: 'landingPage.faq.questions.multipleApplications.content',
    },
    {
      value: 'documents',
      title: 'landingPage.faq.questions.documents.title',
      content: 'landingPage.faq.questions.documents.content',
    },
    {
      value: 'status',
      title: 'landingPage.faq.questions.status.title',
      content: 'landingPage.faq.questions.status.content',
    },
  ];
}

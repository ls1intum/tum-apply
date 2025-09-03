import { Component } from '@angular/core';

import { ProfessorHeroSectionComponent } from './professor-hero-section/professor-hero-section.component';
import { ProfessorDoctoralJourneySectionComponent } from './professor-doctoral-journey-section/professor-doctoral-journey-section.component';
import { ProfessorWorkflowSectionComponent } from './professor-workflow-section/professor-workflow-section.component';
import { ProfessorInformationSectionComponent } from './professor-information-section/professor-information-section.component';
import { ProfessorFaqSectionComponent } from './professor-faq-section/professor-faq-section.component';

@Component({
  selector: 'jhi-professor-landing-page',
  standalone: true,
  imports: [
    ProfessorHeroSectionComponent,
    ProfessorDoctoralJourneySectionComponent,
    ProfessorWorkflowSectionComponent,
    ProfessorInformationSectionComponent,
    ProfessorFaqSectionComponent,
  ],
  templateUrl: './professor-landing-page.component.html',
  styleUrl: './professor-landing-page.component.scss',
})
export class ProfessorLandingPageComponent {}

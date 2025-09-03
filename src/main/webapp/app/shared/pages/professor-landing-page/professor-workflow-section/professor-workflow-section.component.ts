import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';
import { ApplicationStepComponent } from '../../landing-page/application-steps-section/application-step/application-step/application-step.component';

@Component({
  selector: 'jhi-professor-workflow-section',
  standalone: true,
  imports: [ApplicationStepComponent, TranslateModule, TranslateDirective],
  templateUrl: './professor-workflow-section.component.html',
  styleUrl: './professor-workflow-section.component.scss',
})
export class ProfessorWorkflowSectionComponent {
  steps = [
    {
      icon: 'search',
      title: 'professorLandingPage.workflow.steps.1.title',
      description: 'professorLandingPage.workflow.steps.1.description',
    },
    {
      icon: 'info',
      title: 'professorLandingPage.workflow.steps.2.title',
      description: 'professorLandingPage.workflow.steps.2.description',
    },
    {
      icon: 'paper-plane',
      title: 'professorLandingPage.workflow.steps.3.title',
      description: 'professorLandingPage.workflow.steps.3.description',
    },
    {
      icon: 'bell',
      title: 'professorLandingPage.workflow.steps.4.title',
      description: 'professorLandingPage.workflow.steps.4.description',
    },
  ];
}

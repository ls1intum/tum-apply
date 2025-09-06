import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';

import { WorkflowStepComponent } from './workflow-step/workflow-step.component';

@Component({
  selector: 'jhi-professor-workflow-section',
  standalone: true,
  imports: [WorkflowStepComponent, TranslateModule, TranslateDirective],
  templateUrl: './professor-workflow-section.component.html',
  styleUrl: './professor-workflow-section.component.scss',
})
export class ProfessorWorkflowSectionComponent {
  steps = [
    {
      icon: 'file-pen',
      title: 'professorLandingPage.workflow.steps.1.title',
      description: 'professorLandingPage.workflow.steps.1.description',
    },
    {
      icon: 'folder-open',
      title: 'professorLandingPage.workflow.steps.2.title',
      description: 'professorLandingPage.workflow.steps.2.description',
    },
    {
      icon: 'star',
      title: 'professorLandingPage.workflow.steps.3.title',
      description: 'professorLandingPage.workflow.steps.3.description',
    },
    {
      icon: 'calendar-check',
      title: 'professorLandingPage.workflow.steps.4.title',
      description: 'professorLandingPage.workflow.steps.4.description',
    },
  ];
}

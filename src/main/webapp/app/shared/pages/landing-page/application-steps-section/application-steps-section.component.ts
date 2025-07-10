import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';

import { ApplicationStepComponent } from './application-step/application-step/application-step.component';

@Component({
  selector: 'jhi-application-steps-section',
  imports: [ApplicationStepComponent, TranslateModule, TranslateDirective],
  templateUrl: './application-steps-section.component.html',
  styleUrl: './application-steps-section.component.scss',
})
export class ApplicationStepsSectionComponent {
  steps = [
    {
      icon: 'search',
      title: 'landingPage.applicationSteps.steps.1.title',
      description: 'landingPage.applicationSteps.steps.1.description',
    },
    {
      icon: 'info',
      title: 'landingPage.applicationSteps.steps.2.title',
      description: 'landingPage.applicationSteps.steps.2.description',
    },
    {
      icon: 'paper-plane',
      title: 'landingPage.applicationSteps.steps.3.title',
      description: 'landingPage.applicationSteps.steps.3.description',
    },
    {
      icon: 'bell',
      title: 'landingPage.applicationSteps.steps.4.title',
      description: 'landingPage.applicationSteps.steps.4.description',
    },
  ];
}

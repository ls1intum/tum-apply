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
      icon: 'clipboard-check',
      title: 'landingPage.applicationSteps.steps.checkPrerequisites.title',
      description: 'landingPage.applicationSteps.steps.checkPrerequisites.description',
    },
    {
      icon: 'search',
      title: 'landingPage.applicationSteps.steps.browsePositions.title',
      description: 'landingPage.applicationSteps.steps.browsePositions.description',
    },
    {
      icon: 'info',
      title: 'landingPage.applicationSteps.steps.checkDetails.title',
      description: 'landingPage.applicationSteps.steps.checkDetails.description',
    },
    {
      icon: 'paper-plane',
      title: 'landingPage.applicationSteps.steps.submitApplication.title',
      description: 'landingPage.applicationSteps.steps.submitApplication.description',
    },
    {
      icon: 'bell',
      title: 'landingPage.applicationSteps.steps.trackStatus.title',
      description: 'landingPage.applicationSteps.steps.trackStatus.description',
    },
  ];
}

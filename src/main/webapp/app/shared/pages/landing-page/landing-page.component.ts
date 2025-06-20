import { Component } from '@angular/core';

import { environment } from '../../../environments/environment';

import { HeroSectionComponent } from './hero-section/hero-section.component';
import { ApplicationStepsSectionComponent } from './application-steps-section/application-steps-section.component';
import { DoctoralJourneySectionComponent } from './doctoral-journey-section/doctoral-journey-section.component';
import { InformationSectionComponent } from './information-section/information-section.component';
import { VoicesSectionComponent } from './voices-section/voices-section.component';
import { FaqSectionComponent } from './faq-section/faq-section.component';

@Component({
  selector: 'jhi-landing-page',
  imports: [
    HeroSectionComponent,
    ApplicationStepsSectionComponent,
    DoctoralJourneySectionComponent,
    InformationSectionComponent,
    VoicesSectionComponent,
    FaqSectionComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  protected readonly environment = environment;

  constructor() {
    console.log(this.environment);
  }
}

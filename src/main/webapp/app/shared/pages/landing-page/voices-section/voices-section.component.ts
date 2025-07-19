import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';

import { VoiceCardComponent } from './voice-card/voice-card/voice-card.component';

@Component({
  selector: 'jhi-voices-section',
  standalone: true,
  imports: [TranslateModule, VoiceCardComponent, TranslateDirective],
  templateUrl: './voices-section.component.html',
  styleUrl: './voices-section.component.scss',
})
export class VoicesSectionComponent {
  voices = [
    {
      name: 'landingPage.voices.testimonials.1.name',
      field: 'landingPage.voices.testimonials.1.field',
      quote: 'landingPage.voices.testimonials.1.quote',
      imageSrc: '/content/images/landing-page/voices-section/aline-vogt.webp',
    },
    {
      name: 'landingPage.voices.testimonials.2.name',
      field: 'landingPage.voices.testimonials.2.field',
      quote: 'landingPage.voices.testimonials.2.quote',
      imageSrc: '/content/images/landing-page/voices-section/lukas-mueller.webp',
    },
    {
      name: 'landingPage.voices.testimonials.3.name',
      field: 'landingPage.voices.testimonials.3.field',
      quote: 'landingPage.voices.testimonials.3.quote',
      imageSrc: '/content/images/landing-page/voices-section/sofia-klein.webp',
    },
    {
      name: 'landingPage.voices.testimonials.4.name',
      field: 'landingPage.voices.testimonials.4.field',
      quote: 'landingPage.voices.testimonials.4.quote',
      imageSrc: '/content/images/landing-page/voices-section/max-richter.webp',
    },
    {
      name: 'landingPage.voices.testimonials.5.name',
      field: 'landingPage.voices.testimonials.5.field',
      quote: 'landingPage.voices.testimonials.5.quote',
      imageSrc: '/content/images/landing-page/voices-section/emily-wagner.webp',
    },
  ];
}

import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';

import { InformationCardComponent } from './information-card/information-card/information-card.component';

@Component({
  selector: 'jhi-information-section',
  imports: [InformationCardComponent, TranslateModule, TranslateDirective],
  templateUrl: './information-section.component.html',
  styleUrl: './information-section.component.scss',
})
export class InformationSectionComponent {
  cards = [
    {
      imageSrc: '/content/images/landing-page/information-section/excellence.png',
      text: 'landingPage.informationSection.tiles.1',
      link: 'https://www.tum.de/en/about-tum/university-of-excellence',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/events.png',
      text: 'landingPage.informationSection.tiles.2',
      link: 'https://www.gs.tum.de/gs/veranstaltungen/',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/women.png',
      text: 'landingPage.informationSection.tiles.3',
      link: 'https://www.community.tum.de/en/tum-community/women/',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/internationality.png',
      text: 'landingPage.informationSection.tiles.4',
      link: 'https://www.tum.de/en/studies/international-students',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/funding.png',
      text: 'landingPage.informationSection.tiles.5',
      link: 'https://www.gs.tum.de/en/gs/path-to-a-doctorate/funding/',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/diversity.png',
      text: 'landingPage.informationSection.tiles.6',
      link: 'https://www.tum.de/en/about-tum/goals-and-values/diversity',
    },
  ];
}

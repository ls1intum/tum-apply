import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';
import { InformationCardComponent } from '../../landing-page/information-section/information-card/information-card/information-card.component';

@Component({
  selector: 'jhi-professor-information-section',
  standalone: true,
  imports: [InformationCardComponent, TranslateModule, TranslateDirective],
  templateUrl: './professor-information-section.component.html',
  styleUrl: './professor-information-section.component.scss',
})
export class ProfessorInformationSectionComponent {
  cards = [
    {
      imageSrc: '/content/images/landing-page/information-section/excellence.webp',
      text: 'professorLandingPage.informationSection.tiles.1',
      link: 'https://www.tum.de/en/about-tum/university-of-excellence',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/events.webp',
      text: 'professorLandingPage.informationSection.tiles.2',
      link: 'https://www.gs.tum.de/gs/veranstaltungen/',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/women.webp',
      text: 'professorLandingPage.informationSection.tiles.3',
      link: 'https://www.community.tum.de/en/tum-community/women/',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/internationality.webp',
      text: 'professorLandingPage.informationSection.tiles.4',
      link: 'https://www.tum.de/en/studies/international-students',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/funding.webp',
      text: 'professorLandingPage.informationSection.tiles.5',
      link: 'https://www.gs.tum.de/en/gs/path-to-a-doctorate/funding/',
    },
    {
      imageSrc: '/content/images/landing-page/information-section/diversity.webp',
      text: 'professorLandingPage.informationSection.tiles.6',
      link: 'https://www.zv.tum.de/en/diversity/homepage/',
    },
  ];
}

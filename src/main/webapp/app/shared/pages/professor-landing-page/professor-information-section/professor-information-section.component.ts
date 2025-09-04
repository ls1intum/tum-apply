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
      imageSrc: '/content/images/professor-landing-page/information-section/research.webp',
      text: 'professorLandingPage.informationSection.tiles.1',
      link: 'https://www.tum.de/en/research',
    },
    {
      imageSrc: '/content/images/professor-landing-page/information-section/development.webp',
      text: 'professorLandingPage.informationSection.tiles.2',
      link: 'https://www.tum.de/en/lifelong-learning/all-employees',
    },
    {
      imageSrc: '/content/images/professor-landing-page/information-section/networks.webp',
      text: 'professorLandingPage.informationSection.tiles.3',
      link: 'https://web.tum.de/en/inw/home/',
    },
    {
      imageSrc: '/content/images/professor-landing-page/information-section/services.webp',
      text: 'professorLandingPage.informationSection.tiles.4',
      link: 'https://www.tum.de/en/research/support-for-researchers',
    },
    {
      imageSrc: '/content/images/professor-landing-page/information-section/transfer.webp',
      text: 'professorLandingPage.informationSection.tiles.5',
      link: 'https://www.tum.de/en/innovation/patents-and-licenses',
    },
    {
      imageSrc: '/content/images/professor-landing-page/information-section/partnerships.webp',
      text: 'professorLandingPage.informationSection.tiles.6',
      link: 'https://www.international.tum.de/en/global/partnerships-initiatives/',
    },
  ];
}

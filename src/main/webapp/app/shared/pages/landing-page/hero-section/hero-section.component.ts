import { Component } from '@angular/core';
import { Carousel } from 'primeng/carousel';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../../components/atoms/button/button.component';

@Component({
  selector: 'jhi-hero-section',
  standalone: true,
  imports: [ButtonComponent, Carousel, TranslateModule],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {
  images = [
    '/content/images/landing-page/landing-page-hero-section-1.png',
    '/content/images/landing-page/landing-page-hero-section-2.png',
    '/content/images/landing-page/landing-page-hero-section-3.png',
  ];

  getBackgroundClass(image: string): string {
    const fileName = image.split('/').pop()?.split('.')[0];
    return `hero-background-${fileName}`;
  }
}

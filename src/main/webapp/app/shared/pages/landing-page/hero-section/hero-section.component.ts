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
  images = ['landing-page-hero-section-1', 'landing-page-hero-section-2', 'landing-page-hero-section-3'];

  getBackgroundClass(image: string): string {
    return `hero-background-${image}`;
  }
}

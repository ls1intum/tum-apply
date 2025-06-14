import { Component } from '@angular/core';
import { Carousel } from 'primeng/carousel';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../../components/atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-hero-section',
  standalone: true,
  imports: [ButtonComponent, Carousel, TranslateModule, TranslateDirective],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {
  imagesWithBackgroundClass = [
    { image: 'landing-page-hero-section-1', backgroundClass: 'hero-background-landing-page-hero-section-1' },
    { image: 'landing-page-hero-section-2', backgroundClass: 'hero-background-landing-page-hero-section-2' },
    { image: 'landing-page-hero-section-3', backgroundClass: 'hero-background-landing-page-hero-section-3' },
  ];
}

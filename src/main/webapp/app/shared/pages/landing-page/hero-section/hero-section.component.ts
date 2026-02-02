import { Component, inject } from '@angular/core';
import { Carousel } from 'primeng/carousel';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { Router } from '@angular/router';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-hero-section',
  standalone: true,
  imports: [Carousel, TranslateModule, TranslateDirective, ButtonComponent],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {
  imagesWithBackgroundClass = [
    { image: 'landing-page-hero-section-1', backgroundClass: 'hero-background-landing-page-hero-section-1' },
    { image: 'landing-page-hero-section-2', backgroundClass: 'hero-background-landing-page-hero-section-2' },
    { image: 'landing-page-hero-section-3', backgroundClass: 'hero-background-landing-page-hero-section-3' },
  ];

  private router = inject(Router);

  async navigateToPositionsOverview(): Promise<void> {
    await this.router.navigate(['/job-overview']);
  }
}

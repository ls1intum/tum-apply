import { Component, inject } from '@angular/core';
import { Carousel } from 'primeng/carousel';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../components/atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-professor-hero-section',
  standalone: true,
  imports: [ButtonComponent, Carousel, TranslateModule, TranslateDirective],
  templateUrl: './professor-hero-section.component.html',
  styleUrl: './professor-hero-section.component.scss',
})
export class ProfessorHeroSectionComponent {
  imagesWithBackgroundClass = [
    { image: 'landing-page-hero-section-1', backgroundClass: 'hero-background-landing-page-hero-section-1' },
    { image: 'landing-page-hero-section-2', backgroundClass: 'hero-background-landing-page-hero-section-2' },
    { image: 'landing-page-hero-section-3', backgroundClass: 'hero-background-landing-page-hero-section-3' },
  ];

  private router = inject(Router);

  navigateToJobOverview(): void {
    this.router.navigate(['/job-overview']);
  }
}

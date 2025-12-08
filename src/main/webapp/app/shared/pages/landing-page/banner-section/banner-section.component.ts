import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-banner-section',
  imports: [TranslateDirective],
  templateUrl: './banner-section.component.html',
})
export class BannerSectionComponent {
  private router = inject(Router);

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-professor-banner-section',
  imports: [TranslateDirective],
  templateUrl: './professor-banner-section.component.html',
})
export class ProfessorBannerSectionComponent {
  private router = inject(Router);

  navigateToHome(): void {
    this.router.navigate(['/professor']);
  }
}

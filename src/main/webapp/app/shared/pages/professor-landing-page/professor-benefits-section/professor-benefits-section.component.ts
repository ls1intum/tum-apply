import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

import ButtonGroupComponent, { ButtonGroupData } from '../../../components/molecules/button-group/button-group.component';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-professor-benefits-section',
  imports: [CommonModule, TranslateModule, ButtonGroupComponent, TranslateDirective],
  templateUrl: './professor-benefits-section.component.html',
  styleUrl: './professor-benefits-section.component.scss',
})
export class ProfessorBenefitsSectionComponent {
  private router = inject(Router);

  buttons(): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: [
        {
          label: 'professorLandingPage.platformBenefits.button1',
          severity: 'secondary',
          variant: 'outlined',
          disabled: false,
          isExternalLink: false,
          onClick: () => void this.router.navigate(['/job-overview']),
        },
        // TODO: replace link with platform overview when available
        {
          label: 'professorLandingPage.platformBenefits.button2',
          severity: 'primary',
          disabled: true,
          isExternalLink: false,
          onClick: () => void this.router.navigate(['/job-overview']),
        },
      ],
    };
  }
}

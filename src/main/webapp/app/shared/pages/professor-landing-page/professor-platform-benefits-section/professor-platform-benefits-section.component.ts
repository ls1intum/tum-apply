import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import ButtonGroupComponent, { ButtonGroupData } from '../../../components/molecules/button-group/button-group.component';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-professor-platform-benefits-section',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonGroupComponent, TranslateDirective],
  templateUrl: './professor-platform-benefits-section.component.html',
  styleUrl: './professor-platform-benefits-section.component.scss',
})
export class ProfessorPlatformBenefitsSectionComponent {
  private translate = inject(TranslateService);

  buttons(): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: [
        {
          label: this.translate.instant('professorLandingPage.platformBenefits.button1'),
          severity: 'secondary',
          variant: 'outlined',
          disabled: false,
          isExternalLink: true,
          onClick: () => window.open('/job/create', '_blank'),
        },
        {
          label: this.translate.instant('professorLandingPage.platformBenefits.button2'),
          severity: 'primary',
          disabled: false,
          isExternalLink: false,
          onClick: () => window.open('/job-overview', '_blank'),
        },
      ],
    };
  }
}

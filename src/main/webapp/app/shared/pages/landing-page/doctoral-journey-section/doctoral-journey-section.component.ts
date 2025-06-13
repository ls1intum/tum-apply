import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import ButtonGroupComponent, { ButtonGroupData } from '../../../components/molecules/button-group/button-group.component';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-doctoral-journey-section',
  imports: [CommonModule, TranslateModule, ButtonGroupComponent, TranslateDirective],
  templateUrl: './doctoral-journey-section.component.html',
  styleUrl: './doctoral-journey-section.component.scss',
})
export class DoctoralJourneySectionComponent {
  constructor(private translate: TranslateService) {}

  buttons(): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: [
        {
          label: this.translate.instant('landingPage.doctoralJourney.button1'),
          severity: 'secondary',
          variant: 'outlined',
          disabled: false,
          onClick() {},
        },
        {
          label: this.translate.instant('landingPage.doctoralJourney.button2'),
          severity: 'primary',
          disabled: false,
          onClick() {},
        },
      ],
    };
  }
}

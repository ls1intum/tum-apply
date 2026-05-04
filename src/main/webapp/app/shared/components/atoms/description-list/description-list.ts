import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import TranslateDirective from 'app/shared/language/translate.directive';

export interface DescItem {
  labelKey: string;
  value?: string | number | Date | null;
  tooltipText?: string;
}

@Component({
  selector: 'jhi-description-list',
  imports: [TranslateDirective, FontAwesomeModule, TooltipModule],
  templateUrl: './description-list.html',
})
export class DescriptionList {
  items = input.required<readonly DescItem[]>();
  shouldTranslate = input<boolean>(true);
}

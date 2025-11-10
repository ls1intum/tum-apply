import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';

export interface DescItem {
  labelKey: string;
  value?: string | number | Date | null;
  tooltipText?: string;
}

@Component({
  selector: 'jhi-description-list',
  imports: [TranslateModule, FontAwesomeModule, TooltipModule],
  templateUrl: './description-list.html',
})
export class DescriptionList {
  items = input.required<readonly DescItem[]>();
}

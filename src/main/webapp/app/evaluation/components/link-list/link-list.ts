import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';

export interface LinkItem {
  labelKey: string;
  url?: string;
  icon?: string;
  isBrandIcon?: boolean;
}

@Component({
  selector: 'jhi-link-list',
  imports: [FontAwesomeModule, TranslateModule, TooltipModule],
  templateUrl: './link-list.html',
})
export class LinkList {
  links = input.required<readonly LinkItem[]>();
}

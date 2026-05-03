import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import TranslateDirective from 'app/shared/language/translate.directive';

export interface LinkItem {
  labelKey: string;
  url?: string;
  icon?: string;
  isBrandIcon?: boolean;
}

@Component({
  selector: 'jhi-link-list',
  imports: [FontAwesomeModule, TranslateDirective, TooltipModule],
  templateUrl: './link-list.html',
})
export class LinkList {
  links = input.required<readonly LinkItem[]>();
  shouldTranslate = input<boolean>(true);
}

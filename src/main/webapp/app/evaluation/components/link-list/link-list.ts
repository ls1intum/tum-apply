import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

export interface LinkItem {
  labelKey: string;
  url: string;
  icon?: string;
  isBrandIcon?: boolean;
}

@Component({
  selector: 'jhi-link-list',
  imports: [FontAwesomeModule, TranslateModule],
  templateUrl: './link-list.html',
  styleUrl: './link-list.scss',
})
export class LinkList {
  links = input.required<readonly LinkItem[]>();
}

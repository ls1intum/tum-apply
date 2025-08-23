import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface LinkItem {
  labelKey: string;
  url: string;
  icon?: string;
}

@Component({
  selector: 'jhi-link-list',
  imports: [TranslateModule],
  templateUrl: './link-list.html',
  styleUrl: './link-list.scss',
})
export class LinkList {
  links = input.required<readonly LinkItem[]>();
}

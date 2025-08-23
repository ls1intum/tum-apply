import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface DescItem {
  labelKey: string;
  value?: string | number | Date | null;
}

@Component({
  selector: 'jhi-description-list',
  imports: [TranslateModule],
  templateUrl: './description-list.html',
  styleUrl: './description-list.scss',
})
export class DescriptionList {
  items = input.required<readonly DescItem[]>();
}

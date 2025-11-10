import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-sub-section',
  imports: [TranslateModule],
  templateUrl: './sub-section.html',
})
export class SubSection {
  titleKey = input.required<string>();
}

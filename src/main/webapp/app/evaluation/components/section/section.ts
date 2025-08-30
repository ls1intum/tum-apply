import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-section',
  imports: [FontAwesomeModule, TranslateModule],
  templateUrl: './section.html',
})
export class Section {
  title = input.required<string>();
  icon = input<string | undefined>(undefined);
}

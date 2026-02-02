import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-section',
  imports: [FontAwesomeModule, TranslateModule, TranslateDirective],
  templateUrl: './section.html',
})
export class Section {
  titleKey = input.required<string>();
  icon = input<string | undefined>(undefined);
}

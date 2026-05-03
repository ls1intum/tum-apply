import { Component, input } from '@angular/core';
import TranslateDirective from 'app/shared/language/translate.directive';

@Component({
  selector: 'jhi-sub-section',
  imports: [TranslateDirective],
  templateUrl: './sub-section.html',
})
export class SubSection {
  titleKey = input.required<string>();
  shouldTranslate = input<boolean>(true);
}

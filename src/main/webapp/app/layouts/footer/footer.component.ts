import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VERSION } from 'app/app.constants';

import TranslateDirective from '../../shared/language/translate.directive';

@Component({
  selector: 'jhi-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  imports: [TranslateDirective, RouterLink],
  encapsulation: ViewEncapsulation.None,
})
export default class FooterComponent {
  readonly version = VERSION;
}

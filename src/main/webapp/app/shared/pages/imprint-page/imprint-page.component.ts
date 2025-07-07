import { Component, ViewEncapsulation } from '@angular/core';

import TranslateDirective from '../../language/translate.directive';

@Component({
  selector: 'jhi-imprint-page',
  standalone: true,
  imports: [TranslateDirective],
  templateUrl: './imprint-page.component.html',
  styleUrl: './imprint-page.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ImprintPageComponent {}

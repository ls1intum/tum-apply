import { Component, ViewEncapsulation } from '@angular/core';

import TranslateDirective from '../../language/translate.directive';

@Component({
  selector: 'jhi-privacy-page',
  standalone: true,
  imports: [TranslateDirective],
  templateUrl: './privacy-page.component.html',
  styleUrl: './privacy-page.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PrivacyPageComponent {}

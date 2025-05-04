import { Component } from '@angular/core';
import { TranslateDirective } from 'app/shared/language';

@Component({
  selector: 'jhi-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  imports: [TranslateDirective],
})
export default class FooterComponent {}

import { Component, ViewEncapsulation, inject } from '@angular/core';
import { Router } from '@angular/router';
import { VERSION } from 'app/app.constants';

import TranslateDirective from '../../shared/language/translate.directive';

@Component({
  selector: 'jhi-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  imports: [TranslateDirective],
  encapsulation: ViewEncapsulation.None,
})
export default class FooterComponent {
  version: string;

  private router = inject(Router);

  constructor() {
    this.version = VERSION;
  }

  navigateToImprint(): void {
    void this.router.navigate(['/imprint']);
  }

  navigateToPrivacy(): void {
    void this.router.navigate(['/privacy']);
  }
}

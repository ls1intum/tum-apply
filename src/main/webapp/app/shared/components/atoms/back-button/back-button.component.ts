import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'jhi-back-button',
  imports: [ButtonComponent, TranslateModule],
  templateUrl: './back-button.component.html',
})
export class BackButtonComponent {
  private location = inject(Location);

  handleBack(): void {
    this.location.back();
  }
}

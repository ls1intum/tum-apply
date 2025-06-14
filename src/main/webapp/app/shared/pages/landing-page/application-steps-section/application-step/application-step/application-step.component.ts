import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ButtonComponent } from '../../../../../components/atoms/button/button.component';

@Component({
  selector: 'jhi-application-step',
  imports: [FontAwesomeModule, TranslateModule, ButtonComponent],
  templateUrl: './application-step.component.html',
  styleUrl: './application-step.component.scss',
})
export class ApplicationStepComponent {
  icon = input<string>('search');
  title = input<string>('');
  description = input<string>('');
}

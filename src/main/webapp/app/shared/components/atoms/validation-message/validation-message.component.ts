import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-validation-message',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './validation-message.component.html',
})
export class ValidationMessageComponent {
  message = input.required<string>();
  shouldTranslate = input<boolean>(true);
  translationParams = input<Record<string, unknown>>({});
  styleClass = input<string>('');
}

import { Component, input } from '@angular/core';
import { Message } from 'primeng/message';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-message',
  imports: [Message, TranslateModule],
  templateUrl: './message.component.html',
})
export class MessageComponent {
  /**
   * The message text to display.
   * Can be a translation key if shouldTranslate is true.
   */
  message = input<string>('');

  /**
   * The severity/type of the message.
   */
  severity = input<'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast'>('info');

  /**
   * Whether to translate the message using the translation key.
   */
  shouldTranslate = input<boolean>(true);

  /**
   * Additional CSS classes to apply.
   */
  styleClass = input<string>('');

  /**
   * Whether the message can be closed.
   */
  closable = input<boolean>(false);
}

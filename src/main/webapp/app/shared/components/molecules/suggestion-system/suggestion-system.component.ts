import { Component, input, output, signal } from '@angular/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-suggestion-system',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './suggestion-system.component.html',
})
export class SuggestionSystemComponent {
  article = input<string | undefined>(undefined);
  suggestion = input<string | undefined>(undefined);
  explanation = input<string | undefined>(undefined);
  actionLabel = input<string>('Apply');

  accepted = output();
  dismissed = output();

  readonly isActionHovered = signal(false);
}

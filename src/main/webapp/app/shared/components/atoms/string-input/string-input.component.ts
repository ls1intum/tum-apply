import { Component, input, model } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'jhi-string-input',
  imports: [InputTextModule, FontAwesomeModule],
  templateUrl: './string-input.component.html',
  styleUrl: './string-input.component.scss',
})
export class StringInputComponent {
  label = input<string>('');
  value = model.required<string>();
  icon = input<string | undefined>(undefined);
  id = input<string>();
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  area = input<boolean>(false);

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value.set(input.value);
  }
}

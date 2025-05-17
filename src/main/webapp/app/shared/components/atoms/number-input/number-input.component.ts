import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'jhi-number-input',
  templateUrl: './number-input.component.html',
  styleUrl: './number-input.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, InputNumberModule],
  encapsulation: ViewEncapsulation.None,
})
export class NumberInputComponent {
  disabled = input<boolean>(false);
  icon = input<string | undefined>(undefined);
  label = input<string | undefined>(undefined);
  placeholder = input<string | undefined>(undefined);
  required = input<boolean>(false);
  error = input<boolean>(false);
  inputId = input<string | undefined>(undefined);
  labelPosition = input<'top' | 'left'>('top');
  model = input<number | null>(null);
  modelChange = output<number>();
  width = input<string>('100%');

  // Optional min and max values
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);

  // Optional min and max fraction digits
  minFractionDigits = input<number | undefined>(undefined);
  maxFractionDigits = input<number | undefined>(undefined);
}

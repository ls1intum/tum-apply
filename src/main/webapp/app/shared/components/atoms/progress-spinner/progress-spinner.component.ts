import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'jhi-progress-spinner',
  standalone: true,
  templateUrl: './progress-spinner.component.html',
  imports: [CommonModule, ProgressSpinnerModule],
})
export class ProgressSpinnerComponent {
  /**
   * Optional style class passed to PrimeNG ProgressSpinner.
   * Use this to set width/height/tailwind utility classes.
   */
  styleClass = input<string>('');

  /**
   * Thickness of the spinner stroke.
   */
  strokeWidth = input<string>('2');

  /**
   * Optional inline styles.
   */
  style = input<Record<string, string> | null>(null);
}

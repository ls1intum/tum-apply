import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'jhi-toggle-switch',
  standalone: true,
  templateUrl: './toggle-switch.component.html',
  imports: [CommonModule, ToggleSwitchModule, FormsModule],
})
export class ToggleSwitchComponent {
  /**
   * Current on/off state of the toggle.
   */
  model = input<boolean>(false);

  /**
   * Emits whenever the toggle value changes.
   */
  modelChange = output<boolean>();

  /**
   * Whether the toggle is disabled.
   */
  disabled = input<boolean>(false);

  /**
   * Optional style class passed to PrimeNG ToggleSwitch.
   */
  styleClass = input<string>('');

  onChange(value: boolean): void {
    this.modelChange.emit(value);
  }
}

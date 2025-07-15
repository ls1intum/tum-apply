import { Component, ViewEncapsulation, computed, input, output, signal } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

import SharedModule from '../../../shared.module';

export type DropdownOption = {
  name: string;
  value: string | number;
  icon?: string;
};

@Component({
  selector: 'jhi-dropdown',
  standalone: true,
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  imports: [DropdownModule, FontAwesomeModule, FormsModule, CommonModule, TooltipModule, SharedModule],
  encapsulation: ViewEncapsulation.None,
})
export class DropdownComponent {
  items = input<DropdownOption[]>([]);
  selected = input<DropdownOption | undefined>(undefined);
  label = input<string>('');
  required = input<boolean>(false);
  placeholder = input<string>('Select...');
  disabled = input<boolean>(false);
  labelField = input<string>('name');
  valueField = input<string>('value');
  iconField = input<string | undefined>(undefined); // For displaying custom icons for each dropdown item
  prefixIcon = input<string | undefined>(undefined); // For default icon for dropdown placeholder
  width = input<string>('100%');
  icon = input<string | undefined>(undefined);
  tooltipText = input<string | undefined>(undefined);
  shouldTranslate = input<boolean>(false);
  displayErrorText = input<boolean>(true); // Whether to add padding to display error text (disable where not necessary: e.g. sort bar dropdown)

  selectedChange = output<DropdownOption>();

  isOpen = false;
  isTouched = signal(false);

  // Computed property that determines if the field is invalid
  isInvalid = computed(() => {
    return this.required() && this.isTouched() && !this.selected();
  });

  inputState = computed(() => {
    if (!this.isTouched()) return 'untouched';
    if (this.isInvalid()) return 'invalid';
    return 'valid';
  });

  // Error message for required validation
  errorMessage = computed<string | null>(() => {
    return 'global.input.error.required';
  });

  onSelectionChange(value: DropdownOption): void {
    this.selectedChange.emit(value);
  }

  onBlur(): void {
    this.isTouched.set(true);
    console.log('test');
  }
}

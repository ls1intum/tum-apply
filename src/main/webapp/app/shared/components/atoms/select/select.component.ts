import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

import { TranslateDirective } from '../../../language';

export type SelectOption = {
  name: string;
  value: string | number;
  icon?: string;
};

@Component({
  selector: 'jhi-select',
  standalone: true,
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  imports: [SelectModule, FontAwesomeModule, FormsModule, CommonModule, TooltipModule, TranslateDirective],
  encapsulation: ViewEncapsulation.None,
})
export class SelectComponent {
  items = input<SelectOption[]>([]);
  selected = input<SelectOption | undefined>(undefined);
  label = input<string>('');
  required = input<boolean>(false);
  placeholder = input<string>('Select...');
  disabled = input<boolean>(false);
  labelField = input<string>('name');
  valueField = input<string>('value');
  iconField = input<string | undefined>(undefined); // For displaying custom icons for each select item
  prefixIcon = input<string | undefined>(undefined); // For default icon for select placeholder
  width = input<string>('100%');
  icon = input<string | undefined>(undefined);
  tooltipText = input<string | undefined>(undefined);
  translateItems = input<boolean>(false);
  filter = input<boolean>(false);

  selectedChange = output<SelectOption>();

  isOpen = false;

  onSelectionChange(value: SelectOption): void {
    this.selectedChange.emit(value);
  }
}

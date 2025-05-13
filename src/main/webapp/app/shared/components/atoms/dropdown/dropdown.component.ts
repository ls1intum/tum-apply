import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  imports: [DropdownModule, FontAwesomeModule, FormsModule, CommonModule],
  encapsulation: ViewEncapsulation.None,
})
export class DropdownComponent {
  items = input<DropdownOption[]>([]);
  selected = input<DropdownOption | undefined>(undefined);
  label = input<string>('');
  placeholder = input<string>('Select...');
  disabled = input<boolean>(false);
  labelField = input<string>('name');
  valueField = input<string>('value');
  iconField = input<string | undefined>(undefined); // For displaying custom icons for each dropdown item
  prefixIcon = input<string | undefined>(undefined); // For default icon for dropdown placeholder
  labelPosition = input<'top' | 'left'>('top');
  width = input<string>('50%');

  selectedChange = output<DropdownOption>();

  isOpen = false;

  onSelectionChange(value: DropdownOption): void {
    this.selectedChange.emit(value);
  }
}

import { Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { injectTranslator } from 'app/shared/util/translate-signal.util';

import { TranslateDirective } from '../../../language';

export type SelectOption = {
  name: string;
  value: string | number;
  icon?: string;
};
export type size = 'small' | 'large' | undefined;

@Component({
  selector: 'jhi-select',
  standalone: true,
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  imports: [SelectModule, FontAwesomeModule, FormsModule, CommonModule, TooltipModule, TranslateDirective],
  encapsulation: ViewEncapsulation.None,
})
export class SelectComponent {
  id = input<string | undefined>(undefined);
  items = input<SelectOption[]>([]);
  selected = input<SelectOption | undefined>(undefined);
  label = input<string>('');
  required = input<boolean>(false);
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  labelField = input<string>('name');
  valueField = input<string>('value');
  iconField = input<string | undefined>(undefined); // For displaying custom icons for each select item
  prefixIcon = input<string | undefined>(undefined); // For default icon for select placeholder
  width = input<string>('100%');
  icon = input<string | undefined>(undefined);
  tooltipText = input<string | undefined>(undefined);
  translateItems = input<boolean>(false);
  shouldTranslate = input<boolean>(true);
  filter = input<boolean>(false);
  showClear = input<boolean>(false);
  appendTo = input<string | undefined>(undefined);
  dataKey = input<string | undefined>(undefined);
  size = input<size>(undefined);
  errorEnabled = input<boolean>(false);

  selectedChange = output<SelectOption>();

  isOpen = false;
  readonly inputId = computed(() => this.id() ?? 'select-input');

  readonly displayLabel = computed(() => this.translator.translate(this.label(), this.shouldTranslate()) ?? '');
  readonly displayPlaceholder = computed(() => this.translator.translate(this.placeholder(), this.shouldTranslate()) ?? '');
  readonly displayTooltipText = computed(() => this.translator.translate(this.tooltipText(), this.shouldTranslate()) ?? '');

  private translator = injectTranslator();

  onSelectionChange(value: SelectOption): void {
    this.selectedChange.emit(value);
  }
}

import { Component, ViewEncapsulation, computed, input, output, viewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { FilterChange, FilterMultiselect } from '../../components/atoms/filter-multiselect/filter-multiselect';
import TranslateDirective from '../../language/translate.directive';
import { SubjectArea } from './subject-area-subscriptions.store';

export interface SubjectAreaOption {
  name: string;
  value: SubjectArea;
}

@Component({
  selector: 'jhi-subject-area-subscription-selector',
  imports: [FilterMultiselect, FontAwesomeModule, TranslateModule, TranslateDirective],
  templateUrl: './subject-area-subscription-selector.component.html',
  styleUrl: './subject-area-subscription-selector.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SubjectAreaSubscriptionSelectorComponent {
  saving = input<boolean>(false);
  filterOptions = input<string[]>([]);
  selectedValues = input<string[]>([]);
  selectedOptions = input<SubjectAreaOption[]>([]);

  filterChange = output<FilterChange>();
  removeSubjectArea = output<SubjectArea>();

  protected readonly filterMultiselect = viewChild(FilterMultiselect);
  protected readonly isDropdownOpen = computed(() => this.filterMultiselect()?.isOpen() ?? false);

  onFilterChange(filterChange: FilterChange): void {
    this.filterChange.emit(filterChange);
  }

  onRemoveSubjectArea(subjectArea: SubjectArea): void {
    this.removeSubjectArea.emit(subjectArea);
  }
}

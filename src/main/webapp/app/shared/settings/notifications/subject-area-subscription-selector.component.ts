import { Component, computed, input, output, signal, viewChild } from '@angular/core';
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
})
export class SubjectAreaSubscriptionSelectorComponent {
  private static readonly REMOVE_ANIMATION_MS = 150;

  saving = input<boolean>(false);
  filterOptions = input<string[]>([]);
  selectedValues = input<string[]>([]);
  selectedOptions = input<SubjectAreaOption[]>([]);

  filterChange = output<FilterChange>();
  removeSubjectArea = output<SubjectArea>();

  protected readonly removingSubjectAreas = signal<Set<SubjectArea>>(new Set());
  protected readonly filterMultiselect = viewChild(FilterMultiselect);
  protected readonly isDropdownOpen = computed(() => this.filterMultiselect()?.isOpen() ?? false);

  onFilterChange(filterChange: FilterChange): void {
    this.filterChange.emit(filterChange);
  }

  onRemoveSubjectArea(subjectArea: SubjectArea): void {
    if (this.removingSubjectAreas().has(subjectArea)) {
      return;
    }

    this.removingSubjectAreas.update(current => new Set(current).add(subjectArea));
    // Delay the actual removal briefly so the tag can fade/collapse before it disappears from the DOM.
    window.setTimeout(() => {
      this.removeSubjectArea.emit(subjectArea);
      this.removingSubjectAreas.update(current => {
        const next = new Set(current);
        next.delete(subjectArea);
        return next;
      });
    }, SubjectAreaSubscriptionSelectorComponent.REMOVE_ANIMATION_MS); // 150ms
  }

  isRemovingSubjectArea(subjectArea: SubjectArea): boolean {
    return this.removingSubjectAreas().has(subjectArea);
  }
}

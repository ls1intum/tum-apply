import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Generic tab definition for filter tabs.
 * @template T - The type of the tab key (defaults to string)
 */
export interface FilterTab<T extends string = string> {
  /** Unique key identifying this tab */
  key: T;
  /** Translation key for the tab label */
  labelKey: string;
  /** Optional badge count (undefined = no badge shown) */
  count?: number;
  /** Optional translation key for tooltip */
  tooltipKey?: string;
}

/**
 * Reusable filter tabs component with underlined tab bar styling.
 * Displays a horizontal list of tabs with optional badge counts.
 */
@Component({
  selector: 'jhi-filter-tabs',
  standalone: true,
  imports: [TranslateModule, TranslateDirective, TooltipModule],
  templateUrl: './filter-tabs.component.html',
})
export class FilterTabsComponent<T extends string = string> {
  // Inputs
  readonly tabs = input.required<FilterTab<T>[]>();
  readonly activeKey = input.required<T>();

  // Outputs
  readonly filterChange = output<T>();

  // Methods
  isActive(key: T): boolean {
    return this.activeKey() === key;
  }

  onTabClick(key: T): void {
    if (this.activeKey() === key) {
      return;
    }
    this.filterChange.emit(key);
  }
}

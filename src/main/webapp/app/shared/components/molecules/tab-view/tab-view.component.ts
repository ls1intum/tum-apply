import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import TranslateDirective from '../../../language/translate.directive';

export interface TabItem {
  id: string;
  label: string;
  translationKey?: string;
}

@Component({
  selector: 'jhi-tab-view',
  imports: [CommonModule, TranslateDirective],
  templateUrl: './tab-view.component.html',
  styleUrl: './tab-view.component.scss',
})
export class TabViewComponent {
  // Inputs
  tabs = input.required<TabItem[]>();
  activeTabId = input<string>();

  // Outputs
  tabChange = output<string>();

  // Internal state for active tab
  readonly internalActiveTab = signal<string>('');

  // Computed current active tab
  readonly currentActiveTab = computed(() => {
    const externalTab = this.activeTabId();
    if (externalTab) {
      return externalTab;
    }

    const internal = this.internalActiveTab();
    if (internal) {
      return internal;
    }

    // Default to first tab if available
    const tabs = this.tabs();
    return tabs.length > 0 ? tabs[0].id : '';
  });

  selectTab(tabId: string): void {
    this.internalActiveTab.set(tabId);
    this.tabChange.emit(tabId);
  }

  isActive(tabId: string): boolean {
    return this.currentActiveTab() === tabId;
  }
}

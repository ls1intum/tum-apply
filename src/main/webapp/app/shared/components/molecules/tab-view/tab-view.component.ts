import { CommonModule } from '@angular/common';
import { Component, ContentChildren, Directive, QueryList, TemplateRef, computed, inject, input, output } from '@angular/core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

import TranslateDirective from '../../../language/translate.directive';

@Directive({
  selector: 'ng-template[jhiTabPanel]',
  standalone: true,
})
export class TabPanelTemplateDirective {
  tabId = input.required<string>({ alias: 'jhiTabPanel' });
  readonly template: TemplateRef<unknown> = inject<TemplateRef<unknown>>(TemplateRef);
}

export interface TabItem {
  id: string;
  translationKey: string;
}

@Component({
  selector: 'jhi-tab-view',
  imports: [CommonModule, Tabs, TabList, Tab, TabPanels, TabPanel, TranslateDirective],
  templateUrl: './tab-view.component.html',
  styleUrl: './tab-view.component.scss',
})
export class TabViewComponent {
  // Inputs
  tabs = input.required<TabItem[]>();
  activeTabId = input<string>();
  lazyLoad = input<boolean>(true);
  selectOnFocus = input<boolean>(true);

  // Outputs
  tabChange = output<string>();

  @ContentChildren(TabPanelTemplateDirective) tabPanels?: QueryList<TabPanelTemplateDirective>;

  // Computed current active tab id for PrimeNG binding
  readonly currentTabValue = computed(() => {
    const externalTab = this.activeTabId();
    if (externalTab) {
      return externalTab;
    }

    // Default to first tab if available
    const tabs = this.tabs();
    return tabs.length > 0 ? tabs[0].id : undefined;
  });

  onTabChange(tabId: string | number | undefined): void {
    if (typeof tabId === 'string') {
      this.tabChange.emit(tabId);
    }
  }

  findTemplate(tabId: string): TemplateRef<unknown> | null {
    const panels: readonly TabPanelTemplateDirective[] = this.tabPanels?.toArray() ?? [];
    const match = panels.find(panel => panel.tabId() === tabId);
    return match ? match.template : null;
  }
}

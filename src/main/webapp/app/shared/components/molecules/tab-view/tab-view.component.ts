import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  QueryList,
  TemplateRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

import TranslateDirective from '../../../language/translate.directive';

@Directive({
  selector: 'ng-template[jhiTabPanel]',
  standalone: true,
})
export class TabPanelTemplateDirective {
  // Tab identifier that should match the corresponding TabItem id
  tabId = input.required<string>({ alias: 'jhiTabPanel' });

  readonly template: TemplateRef<unknown> = inject<TemplateRef<unknown>>(TemplateRef);
}

export interface TabItem {
  id: string;
  label: string;
  translationKey?: string;
}

@Component({
  selector: 'jhi-tab-view',
  imports: [CommonModule, Tabs, TabList, Tab, TabPanels, TabPanel, TranslateDirective],
  templateUrl: './tab-view.component.html',
  styleUrl: './tab-view.component.scss',
})
export class TabViewComponent implements AfterViewInit {
  // Inputs
  tabs = input.required<TabItem[]>();
  activeTabId = input<string>();
  lazyLoad = input<boolean>(true); // Lazily render tab content by default
  selectOnFocus = input<boolean>(true); // Activate tab when focused via keyboard

  // Outputs
  tabChange = output<string>();

  // Internal state for active tab id
  readonly internalActiveTabId = signal<string | undefined>(undefined);
  readonly loadedTabs = signal<Set<string>>(new Set());

  @ContentChildren(TabPanelTemplateDirective) tabPanels?: QueryList<TabPanelTemplateDirective>;
  @ViewChild('tabsRoot') tabsRoot?: ElementRef<HTMLElement>;

  // Computed current active tab id for PrimeNG binding
  readonly currentTabValue = computed(() => {
    const externalTab = this.activeTabId();
    if (externalTab) {
      return externalTab;
    }

    const internal = this.internalActiveTabId();
    if (internal) {
      return internal;
    }

    // Default to first tab if available
    const tabs = this.tabs();
    return tabs.length > 0 ? tabs[0].id : undefined;
  });

  constructor() {
    effect(() => {
      const currentId = this.currentTabValue();
      if (currentId) {
        this.markTabAsLoaded(currentId);
      }
      queueMicrotask(() => {
        this.focusActiveTab();
      });
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.focusActiveTab();
    });
  }

  // Helper to check if a tab is active
  isTabActive(tabId: string): boolean {
    return this.currentTabValue() === tabId;
  }

  onTabChange(tabId: string | number | undefined): void {
    if (typeof tabId !== 'string') return;

    this.internalActiveTabId.set(tabId);
    this.markTabAsLoaded(tabId);
    this.tabChange.emit(tabId);
  }

  findTemplate(tabId: string): TemplateRef<unknown> | null {
    const panel = this.tabPanels?.toArray().find(p => p.tabId() === tabId);
    return panel?.template ?? null;
  }

  shouldRenderContent(tabId: string): boolean {
    if (!this.lazyLoad()) return true;
    return this.loadedTabs().has(tabId) || this.isTabActive(tabId);
  }

  private markTabAsLoaded(tabId: string): void {
    if (this.loadedTabs().has(tabId)) return;
    const updated = new Set(this.loadedTabs());
    updated.add(tabId);
    this.loadedTabs.set(updated);
  }

  private focusActiveTab(): void {
    const host = this.tabsRoot?.nativeElement;
    if (!host) return;

    const active = host.querySelector<HTMLElement>('.p-tab[data-p-active="true"]');
    const first = host.querySelector<HTMLElement>('.p-tab');
    const target = active ?? first;
    target?.focus({ preventScroll: true });
  }
}

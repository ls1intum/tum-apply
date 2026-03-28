import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TabItem, TabPanelTemplateDirective, TabViewComponent } from 'app/shared/components/molecules/tab-view/tab-view.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

const DEFAULT_TABS: TabItem[] = [
  { id: 'general', translationKey: 'settings.tabs.general' },
  { id: 'documents', translationKey: 'settings.tabs.documents', icon: ['fas', 'file'] },
];

@Component({
  standalone: true,
  imports: [TabViewComponent, TabPanelTemplateDirective],
  template: `
    <jhi-tab-view [tabs]="tabs">
      <ng-template jhiTabPanel="general">General Content</ng-template>
      <ng-template jhiTabPanel="documents">Documents Content</ng-template>
    </jhi-tab-view>
  `,
})
class TabViewHostComponent {
  tabs = DEFAULT_TABS;
}

describe('TabViewComponent', () => {
  let fixture: ComponentFixture<TabViewComponent>;
  let component: TabViewComponent;

  const createComponent = (tabs: TabItem[], activeTabId?: string, tabsClass = ''): void => {
    fixture = TestBed.createComponent(TabViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('tabsClass', tabsClass);

    if (activeTabId !== undefined) {
      fixture.componentRef.setInput('activeTabId', activeTabId);
    }

    fixture.detectChanges();
  };

  const createHostComponent = (): ComponentFixture<TabViewHostComponent> => {
    const hostFixture = TestBed.createComponent(TabViewHostComponent);
    hostFixture.detectChanges();
    return hostFixture;
  };

  const getHostTabViewComponent = (hostFixture: ComponentFixture<TabViewHostComponent>): TabViewComponent => {
    return hostFixture.debugElement.query(By.directive(TabViewComponent)).componentInstance;
  };

  beforeEach(async () => {
    class ResizeObserverMock {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    global.ResizeObserver = ResizeObserverMock;

    await TestBed.configureTestingModule({
      imports: [TabViewComponent, TabViewHostComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting(), provideNoopAnimations()],
    }).compileComponents();
  });

  it('should use the provided active tab id when it is not empty', () => {
    createComponent(DEFAULT_TABS, 'documents');

    expect(component.currentTabValue()).toBe('documents');
  });

  it('should default to the first tab when no active tab id is provided', () => {
    createComponent(DEFAULT_TABS);

    expect(component.currentTabValue()).toBe('general');
  });

  it('should return undefined as the current tab when there are no tabs', () => {
    createComponent([], '');

    expect(component.currentTabValue()).toBeUndefined();
  });

  it('should emit a tab change when the selected tab id is a string', () => {
    createComponent(DEFAULT_TABS);

    const emitSpy = vi.spyOn(component.tabChange, 'emit');
    component.onTabChange('documents');

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('documents');
  });

  it('should ignore tab change values that are not strings', () => {
    createComponent(DEFAULT_TABS);

    const emitSpy = vi.spyOn(component.tabChange, 'emit');
    component.onTabChange(1);
    component.onTabChange(undefined);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should return null when no tab panels are projected', () => {
    createComponent(DEFAULT_TABS);

    expect(component.findTemplate('nonexistent')).toBeNull();
  });

  it('should return the matching projected template for a tab id', () => {
    const hostFixture = createHostComponent();
    const tabViewComponent = getHostTabViewComponent(hostFixture);
    const expectedTemplate = tabViewComponent.tabPanels()[0]?.template ?? null;

    expect(tabViewComponent.findTemplate('general')).toBe(expectedTemplate);
  });

  it('should return null when no projected template matches the tab id', () => {
    const hostFixture = createHostComponent();
    const tabViewComponent = getHostTabViewComponent(hostFixture);

    expect(tabViewComponent.findTemplate('notifications')).toBeNull();
  });
});

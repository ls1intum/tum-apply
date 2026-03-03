import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router, NavigationStart } from '@angular/router';
import { Subject } from 'rxjs';

import { MenuComponent, JhiMenuItem } from 'app/shared/components/atoms/menu/menu.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

type MenuForTest = {
  items: JhiMenuItem[];
  popup: boolean;
  appendTo: HTMLElement | string;
  shouldTranslate: boolean;
};

describe('MenuComponent', () => {
  let routerEventsSubject: Subject<any>;
  let mockRouter: { events: Subject<any> };

  function createMenuFixture(overrideInputs: Partial<MenuForTest>) {
    const fixture = TestBed.createComponent(MenuComponent);

    const defaults: Partial<MenuForTest> = {
      items: [],
      popup: true,
      appendTo: 'body',
      shouldTranslate: false,
    };

    const inputs = { ...defaults, ...overrideInputs };

    Object.entries(inputs).forEach(([key, value]) => {
      fixture.componentRef.setInput(key as keyof MenuForTest, value);
    });

    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    routerEventsSubject = new Subject();
    mockRouter = {
      events: routerEventsSubject,
    };

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock(), { provide: Router, useValue: mockRouter }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = createMenuFixture({ items: [] });
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('buildStyleClass logic', () => {
    it('should build styleClass for disabled menu item', () => {
      const items: JhiMenuItem[] = [{ label: 'Disabled item', disabled: true }];

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      expect(menuModel[0].styleClass).toContain('pointer-events-none');
      expect(menuModel[0].styleClass).toContain('text-text-disabled');
      expect(menuModel[0].styleClass).toContain('cursor-not-allowed');
    });

    it('should map severity to CSS class', () => {
      const items: JhiMenuItem[] = [{ label: 'Danger item', severity: 'danger' }];

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      expect(menuModel[0].styleClass).toContain('menu-danger');
    });

    it('should combine custom styleClass with severity', () => {
      const items: JhiMenuItem[] = [{ label: 'Combined item', severity: 'danger', styleClass: 'custom-class' }];

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      expect(menuModel[0].styleClass).toContain('menu-danger');
      expect(menuModel[0].styleClass).toContain('custom-class');
    });

    it('should return empty string when no styleClass, severity, or disabled', () => {
      const items: JhiMenuItem[] = [{ label: 'Plain item' }];

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      expect(menuModel[0].styleClass).toBe('');
    });

    it('should not include empty styleClass string', () => {
      const items: JhiMenuItem[] = [{ label: 'Item', styleClass: '' }];

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      expect(menuModel[0].styleClass).toBe('');
    });

    it('should not include disabled classes when disabled is false', () => {
      const items: JhiMenuItem[] = [{ label: 'Item', disabled: false }];

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      expect(menuModel[0].styleClass).not.toContain('pointer-events-none');
    });
  });

  describe('handleCommand logic', () => {
    it('should call item command and clean up popups', () => {
      const commandSpy = vi.fn();
      const items: JhiMenuItem[] = [{ label: 'Clickable item', command: commandSpy }];

      const mockElement = document.createElement('div');
      mockElement.setAttribute('name', 'p-anchored-overlay');
      document.body.appendChild(mockElement);

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      menuModel[0].command?.();

      expect(commandSpy).toHaveBeenCalledOnce();
      const remainingElements = document.querySelectorAll('body > [name="p-anchored-overlay"]');
      expect(remainingElements.length).toBe(0);
    });

    it('should handle undefined command gracefully', () => {
      const items: JhiMenuItem[] = [{ label: 'Item without command' }];

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      expect(() => menuModel[0].command?.()).not.toThrow();
    });
  });

  describe('clearMenuPopups logic', () => {
    it('should clean up menu popups on navigation start', () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('name', 'p-anchored-overlay');
      document.body.appendChild(mockElement);

      const fixture = createMenuFixture({ items: [] });

      routerEventsSubject.next(new NavigationStart(1, '/test'));

      const remainingElements = document.querySelectorAll('body > [name="p-anchored-overlay"]');
      expect(remainingElements.length).toBe(0);
    });
  });

  describe('public API methods', () => {
    it('should call menu toggle method', () => {
      const fixture = createMenuFixture({ items: [] });
      const menuComponent = fixture.componentInstance.menu();
      const toggleSpy = vi.spyOn(menuComponent, 'toggle');
      const event = new Event('click');

      fixture.componentInstance.toggle(event);

      expect(toggleSpy).toHaveBeenCalledWith(event);
    });

    it('should call menu show method', () => {
      const fixture = createMenuFixture({ items: [] });
      const menuComponent = fixture.componentInstance.menu();
      const showSpy = vi.spyOn(menuComponent, 'show');
      const event = new Event('click');

      fixture.componentInstance.show(event);

      expect(showSpy).toHaveBeenCalledWith(event);
    });

    it('should call menu hide method', () => {
      const fixture = createMenuFixture({ items: [] });
      const menuComponent = fixture.componentInstance.menu();
      const hideSpy = vi.spyOn(menuComponent, 'hide');

      fixture.componentInstance.hide();

      expect(hideSpy).toHaveBeenCalled();
    });
  });
});

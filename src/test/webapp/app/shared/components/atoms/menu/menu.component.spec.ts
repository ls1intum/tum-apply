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

    const inputs = Object.assign({}, defaults, overrideInputs);

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

  describe('Command handling', () => {
    it('should call the item command and clean up popups when invoked', () => {
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
      expect(remainingElements).toHaveLength(0);
    });

    it('should not throw when an item has no command', () => {
      const items: JhiMenuItem[] = [{ label: 'Item without command' }];

      const fixture = createMenuFixture({ items });

      const menuModel = fixture.componentInstance.menuModel();
      expect(() => menuModel[0].command?.()).not.toThrow();
    });
  });

  describe('Router cleanup', () => {
    it('should clean up popups on navigation start', () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('name', 'p-anchored-overlay');
      document.body.appendChild(mockElement);

      createMenuFixture({ items: [] });

      routerEventsSubject.next(new NavigationStart(1, '/test'));

      const remainingElements = document.querySelectorAll('body > [name="p-anchored-overlay"]');
      expect(remainingElements).toHaveLength(0);
    });
  });

  describe('Public API forwarding', () => {
    it.each<['toggle' | 'show' | 'hide', boolean]>([
      ['toggle', true],
      ['show', true],
      ['hide', false],
    ])('should forward %s() to the underlying PrimeNG menu', (method, withEvent) => {
      const fixture = createMenuFixture({ items: [] });
      const menuComponent = fixture.componentInstance.menu();
      const spy = vi.spyOn(menuComponent, method);
      const event = new Event('click');

      if (withEvent) {
        (fixture.componentInstance as any)[method](event);
        expect(spy).toHaveBeenCalledWith(event);
      } else {
        fixture.componentInstance.hide();
        expect(spy).toHaveBeenCalledOnce();
      }
    });
  });
});

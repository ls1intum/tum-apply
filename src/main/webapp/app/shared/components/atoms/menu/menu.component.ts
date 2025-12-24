import { Component, computed, input, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';

import { ButtonColor } from '../button/button.component';

export type MenuItemSeverity = ButtonColor;

export interface MenuItemEvent {
  originalEvent: Event;
  item: JhiMenuItem;
}

export interface JhiMenuItem {
  label: string;
  icon?: string;
  command?: (_e: MenuItemEvent) => void;
  severity?: MenuItemSeverity;
  disabled?: boolean;
  separator?: boolean;
  visible?: boolean;
  styleClass?: string;
}

@Component({
  selector: 'jhi-menu',
  templateUrl: './menu.component.html',
  imports: [CommonModule, MenuModule, FontAwesomeModule, TranslateModule, TranslateDirective],
})
export class MenuComponent {
  items = input.required<JhiMenuItem[]>();
  popup = input<boolean>(true);
  appendTo = input<string | HTMLElement>('body');
  shouldTranslate = input<boolean>(false);

  menu = viewChild.required<Menu>('menu');

  // Computed property to convert JhiMenuItem to PrimeNG MenuItem format
  menuModel = computed(() => {
    return this.items().map(item => ({
      label: item.label,
      icon: item.icon,
      command: item.command,
      disabled: item.disabled,
      separator: item.separator,
      visible: item.visible,
      styleClass: this.getSeverityClass(item),
    }));
  });

  // Get severity class for styling
  getSeverityClass(item: JhiMenuItem): string {
    const classes: string[] = [];

    if (item.styleClass !== undefined && item.styleClass !== '') {
      classes.push(item.styleClass);
    }

    if (item.severity !== undefined) {
      const severityClassMap: Record<MenuItemSeverity, string> = {
        primary: 'menu-primary',
        secondary: 'menu-secondary',
        contrast: 'menu-contrast',
        success: 'menu-success',
        warn: 'menu-warn',
        danger: 'menu-danger',
        info: 'menu-info',
      };
      classes.push(severityClassMap[item.severity]);
    }

    return classes.join(' ');
  }

  toggle(event: Event): void {
    this.menu().toggle(event);
  }

  show(event: Event): void {
    this.menu().show(event);
  }

  hide(): void {
    this.menu().hide();
  }
}

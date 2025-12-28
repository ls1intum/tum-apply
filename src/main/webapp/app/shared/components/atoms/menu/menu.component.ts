import { Component, computed, input, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { TranslateDirective } from 'app/shared/language';

import { ButtonColor } from '../button/button.component';

export type MenuItemSeverity = ButtonColor;

export interface JhiMenuItem {
  label: string;
  icon?: string;
  command?: () => void;
  severity?: MenuItemSeverity;
  disabled?: boolean;
  styleClass?: string;
}

@Component({
  selector: 'jhi-menu',
  templateUrl: './menu.component.html',
  imports: [CommonModule, MenuModule, FontAwesomeModule, TranslateDirective],
})
export class MenuComponent {
  items = input.required<JhiMenuItem[]>();
  popup = input<boolean>(true);
  appendTo = input<HTMLElement | string>('body');
  shouldTranslate = input<boolean>(false);

  menu = viewChild.required<Menu>('menu');

  // Computed property to convert JhiMenuItem to PrimeNG MenuItem format
  menuModel = computed(() => {
    return this.items().map(item => ({
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
      styleClass: this.buildStyleClass(item),
      command: () => this.handleCommand(item),
    }));
  });

  // Map severity to CSS class
  private readonly severityClassMap: Record<MenuItemSeverity, string> = {
    primary: 'menu-primary',
    secondary: 'menu-secondary',
    contrast: 'menu-contrast',
    success: 'menu-success',
    warn: 'menu-warn',
    danger: 'menu-danger',
    info: 'menu-info',
  };

  toggle(event: Event): void {
    this.menu().toggle(event);
  }

  show(event: Event): void {
    this.menu().show(event);
  }

  hide(): void {
    this.menu().hide();
  }

  private handleCommand(item: JhiMenuItem): void {
    if (item.disabled === true) {
      return;
    }
    if (item.command !== undefined) {
      item.command();
    }

    this.hide();
  }

  // Build style class string for item
  private buildStyleClass(item: JhiMenuItem): string {
    const parts: string[] = [];

    if (item.styleClass !== undefined && item.styleClass !== '') {
      parts.push(item.styleClass);
    }

    if (item.severity !== undefined) {
      parts.push(this.severityClassMap[item.severity]);
    }

    if (item.disabled === true) {
      parts.push('pointer-events-none text-text-disabled cursor-not-allowed');
    }

    return parts.length > 0 ? parts.join(' ') : '';
  }
}

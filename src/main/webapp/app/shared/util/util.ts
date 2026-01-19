import { Signal, computed } from '@angular/core';

import { JhiMenuItem } from '../components/atoms/menu/menu.component';

/**
 * Trims a website URL to show only the domain name
 * @param url The full URL to trim
 * @returns The domain name (e.g., "tum.de" from "https://www.tum.de/...")
 */
export function trimWebsiteUrl(url: string): string {
  if (!url) return '';

  try {
    let trimmedUrl = url.replace(/^https?:\/\//, '');

    trimmedUrl = trimmedUrl.replace(/^www\./, '');

    trimmedUrl = trimmedUrl.split('/')[0].split('?')[0].split('#')[0];

    return trimmedUrl;
  } catch {
    return url;
  }
}

/**
 * Configuration for menu action utilities
 */
export interface MenuActionConfig {
  /**
   * Signal indicating whether a primary action button is present
   */
  hasPrimaryButton: Signal<boolean>;
  /**
   * Signal containing the menu items
   */
  menuItems: Signal<JhiMenuItem[]>;
  /**
   * Threshold for showing kebab menu (default: 3)
   * If total actions (primary button + menu items) >= threshold, show kebab menu
   */
  kebabThreshold?: number;
}

/**
 * Creates computed signals for managing kebab menu display logic.
 * Returns two signals:
 * - shouldShowKebabMenu: true if total actions >= threshold (default 3)
 * - individualActionButtons: menu items to display as individual buttons (empty if kebab menu shown)
 *
 * @param config Configuration object containing primary button status and menu items
 * @returns Object containing shouldShowKebabMenu and individualActionButtons signals
 */
export function createMenuActionSignals(config: MenuActionConfig): {
  shouldShowKebabMenu: Signal<boolean>;
  individualActionButtons: Signal<JhiMenuItem[]>;
} {
  const shouldShowKebabMenu = computed<boolean>(() => {
    const primaryButton = config.hasPrimaryButton();
    const menuItemsCount = config.menuItems().length;
    const totalActions = (primaryButton ? 1 : 0) + menuItemsCount;
    const threshold = config.kebabThreshold ?? 3;

    return totalActions >= threshold;
  });

  const individualActionButtons = computed<JhiMenuItem[]>(() => {
    if (shouldShowKebabMenu()) {
      return [];
    }
    return config.menuItems();
  });

  return {
    shouldShowKebabMenu,
    individualActionButtons,
  };
}

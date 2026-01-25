import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';

import { provideZonelessChangeDetection, NgModule } from '@angular/core';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
export class ZonelessTestModule {}

getTestBed().initTestEnvironment([BrowserTestingModule, ZonelessTestModule], platformBrowserTesting());

// Suppress JSDOM CSS parsing errors for CSS custom properties in shorthand properties
// This is a known limitation of jsdom/cssstyle that doesn't affect test functionality
window.addEventListener('error', event => {
  const errorMessage = event.error?.message || event.message || '';
  // Suppress CSS custom property parsing errors from cssstyle
  if (
    errorMessage.includes("Cannot create property 'border-width'") ||
    errorMessage.includes("Cannot create property 'border-style'") ||
    errorMessage.includes("Cannot create property 'border-color'") ||
    (errorMessage.includes('border') && errorMessage.includes('var(--'))
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

// Provide a lightweight, no-op IntersectionObserver mock for jsdom tests.
// Some components use IntersectionObserver (e.g. progress-stepper) which isn't available in the
// jsdom environment used by Vitest. A simple mock prevents ReferenceError and is sufficient
// for unit tests that don't require real intersection behavior.
if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    callback: any;
    root: Element | null;
    rootMargin: string;
    thresholds: number | number[];
    constructor(callback: any, options?: any) {
      this.callback = callback;
      this.root = options?.root ?? null;
      this.rootMargin = options?.rootMargin ?? '0px';
      this.thresholds = options?.threshold ?? 0;
    }
    observe() {
      // no-op
    }
    unobserve() {
      // no-op
    }
    disconnect() {
      // no-op
    }
    takeRecords() {
      return [];
    }
  }
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
  (globalThis as any).IntersectionObserverEntry = class {};
}

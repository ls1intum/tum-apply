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

import { Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

/**
 * Utility to make TypeScript-defined UI elements reactive to language changes.
 *
 * This utility creates a Signal that "notifies" any computed() block to re-run when the language changes,
 * ensuring the UI stays in sync with the global Language Switcher.
 *
 * @example
 * private readonly currentLang = toLanguageSignal();
 *
 * tooltipText = computed(() => {
 *   this.currentLang(); // Register dependency (the "wake-up call")
 *   return this.translateService.instant('interview.tooltip'); // Now updates automatically!
 * });
 *
 * @param translateService Optional. If not provided, it will be injected automatically.
 * @returns A Signal containing the current ISO language code (e.g., 'en', 'de').
 */
export function toLanguageSignal(translateService?: TranslateService): Signal<string> {
  const service = translateService ?? inject(TranslateService);
  return toSignal(service.onLangChange.pipe(map((event: LangChangeEvent) => event.lang)), {
    initialValue: service.currentLang,
  });
}

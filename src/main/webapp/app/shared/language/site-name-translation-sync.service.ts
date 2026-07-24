import { Injectable, effect, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SiteConfigService } from 'app/core/config/site-config.service';

/**
 * Bridges the reactive site-name signal to ngx-translate.
 *
 * The translate compiler injects the configurable site name as an implicit
 * `{siteName}` parameter, but the `translate` pipe and directive cache their
 * resolved output and only refresh on a translation/language change event — so
 * a live rename would otherwise not reach already-rendered text. Whenever the
 * site name changes, this re-stores the current language's translations (a
 * no-op merge) to fire `onTranslationChange`, which the pipe and directive
 * listen to and re-render from. Direct signal readers (e.g. the header) already
 * update on their own.
 *
 * Instantiated once at startup via an app initializer.
 */
@Injectable({ providedIn: 'root' })
export class SiteNameTranslationSync {
  private readonly translateService = inject(TranslateService);
  private readonly siteConfigService = inject(SiteConfigService);

  constructor() {
    effect(() => {
      // Track the site name so this re-runs whenever an admin changes it.
      this.siteConfigService.siteName();
      const lang = this.translateService.getCurrentLang();
      if (lang) {
        this.translateService.setTranslation(lang, {}, true);
      }
    });
  }
}

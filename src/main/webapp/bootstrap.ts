import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { NgbDatepickerConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import locale from '@angular/common/locales/en';
// eslint-disable-next-line no-restricted-imports
import dayjs from 'dayjs';
import { SessionStorageService } from 'ngx-webstorage';
import { provideAnimations } from '@angular/platform-browser/animations';

import { DEBUG_INFO_ENABLED } from './app/app.constants';
import AppComponent from './app/app.component';
import { appConfig } from './app/app.config';
import { JhiLanguageHelper } from './app/config/language.helper';
import { MessageService } from 'primeng/api';

// disable debug data on prod profile to improve performance
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!DEBUG_INFO_ENABLED) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...appConfig.providers, provideAnimations(), MessageService],
})
  .then(app => {
    const dpConfig = app.injector.get(NgbDatepickerConfig);
    const tooltipConfig = app.injector.get(NgbTooltipConfig);
    const translateService = app.injector.get(TranslateService);
    const languageHelper = app.injector.get(JhiLanguageHelper);
    const sessionStorageService = app.injector.get(SessionStorageService);

    // Perform initialization logic
    registerLocaleData(locale);
    dpConfig.minDate = { year: dayjs().subtract(100, 'year').year(), month: 1, day: 1 };
    translateService.setDefaultLang('en');
    const languageKey = sessionStorageService.retrieve('locale') ?? languageHelper.determinePreferredLanguage();
    translateService.use(languageKey);
    tooltipConfig.container = 'body';

    /* // Set up global dark mode based on browser settings
             const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
             const updateDarkModeClass = (isDarkMode: boolean): void => {
               const className = 'tum-apply-dark-mode';
               if (isDarkMode) {
                 document.body.classList.add(className);
               } else {
                 document.body.classList.remove(className);
               }
             };
    
        // Initialize and listen for changes
        updateDarkModeClass(darkModeMediaQuery.matches);
        darkModeMediaQuery.addEventListener('change', event => {
          updateDarkModeClass(event.matches);
        });*/
  })

  .catch((err: unknown) => console.error(err));

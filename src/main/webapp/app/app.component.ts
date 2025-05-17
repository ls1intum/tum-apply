import { Component, inject } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import dayjs from 'dayjs/esm';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import locale from '@angular/common/locales/en';
import { RouterModule, RouterOutlet } from '@angular/router';

import { fontAwesomeIcons } from './config/font-awesome-icons';
import MainComponent from './layouts/main/main.component';

@Component({
  selector: 'jhi-app',
  template: '<jhi-main />',
  imports: [MainComponent, RouterOutlet, RouterModule],
})
export default class AppComponent {
  private readonly iconLibrary = inject(FaIconLibrary);
  private readonly dpConfig = inject(NgbDatepickerConfig);

  constructor() {
    registerLocaleData(locale);
    this.iconLibrary.addIcons(...fontAwesomeIcons);
    this.dpConfig.minDate = { year: dayjs().subtract(100, 'year').year(), month: 1, day: 1 };
    this.setSystemTheme();
  }

  private setSystemTheme(): void {
    const classList = document.documentElement.classList;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // set initial theme based on system preference
    if (prefersDark.matches) {
      classList.add('dark-theme');
    } else {
      classList.remove('dark-theme');
    }

    // change theme dynamically when user changes system theme
    prefersDark.addEventListener('change', e => {
      if (e.matches) {
        classList.add('dark-theme');
      } else {
        classList.remove('dark-theme');
      }
    });
  }
}

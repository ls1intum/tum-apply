import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

/**
 * Wires PrimeNG's internal i18n (month/weekday names, Today/Clear labels) to the app language.
 * PrimeNG v20 reads these from a global translation map, configured via PrimeNG.setTranslation().
 *
 * This service is primarily used by PrimeNG Calendar components (DatePicker) to display
 * localized month names, day names, and UI labels based on the current application language.
 */
@Injectable({ providedIn: 'root' })
export class PrimengTranslationService {
  private readonly translate = inject(TranslateService);
  private readonly primeNG = inject(PrimeNG);

  constructor() {
    const initial = this.translate.getCurrentLang() || 'en';
    this.applyLocale(initial);
    this.translate.onLangChange.subscribe(event => {
      this.applyLocale(event.lang);
    });
  }

  private applyLocale(lang: string): void {
    const isDe = lang.toLowerCase().startsWith('de');
    if (isDe) {
      this.primeNG.setTranslation({
        dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
        today: 'Heute',
        clear: 'Zurücksetzen',
        weekHeader: 'KW',
      });
    } else {
      this.primeNG.setTranslation({
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        monthNames: [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        today: 'Today',
        clear: 'Clear',
        weekHeader: 'Wk',
      });
    }
  }
}

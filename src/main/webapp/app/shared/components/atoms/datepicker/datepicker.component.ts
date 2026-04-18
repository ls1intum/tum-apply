import { Component, ViewEncapsulation, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { parseLocalDateString } from 'app/shared/util/date-time.util';
import TranslateDirective from 'app/shared/language/translate.directive';
import { DatePickerDateMeta } from 'primeng/types/datepicker';

@Component({
  selector: 'jhi-datepicker',
  standalone: true,
  imports: [DatePickerModule, FormsModule, FontAwesomeModule, TranslateModule, TranslateDirective, TooltipModule],
  templateUrl: './datepicker.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class DatePickerComponent {
  isCalendarOpen = signal(false);

  width = input<string>('100%');
  label = input<string | undefined>(undefined);
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  placeholder = input<string | undefined>(undefined);
  icon = input<string | undefined>(undefined);
  tooltipText = input<string | undefined>(undefined);
  shouldTranslate = input<boolean>(false);
  errorEnabled = input<boolean>(false);

  /**
   * Input date value in ISO format: 'YYYY-MM-DD'
   */
  selectedDate = input<string | undefined>(undefined);

  /**
   * Minimum selectable date - if not provided, defaults to today to prevent past date selection
   */
  minDate = input<Date | undefined>(undefined);

  /**
   * Maximum selectable date - if not provided, no maximum date restriction
   */
  maxDate = input<Date | undefined>(undefined);

  /**
   * Default date to show in calendar when opening (does not set the value, just the view)
   */
  defaultDate = input<Date | null>(null);

  /**
   * Optional reference date to highlight inside the calendar.
   */
  highlightedDate = input<Date | undefined>(undefined);

  /**
   * Optional label shown when hovering or focusing the highlighted day.
   */
  highlightedDateLabel = input<string | undefined>(undefined);

  /**
   * Emits ISO date string ('YYYY-MM-DD') when user selects a date
   */
  selectedDateChange = output<string | undefined>();

  /**
   * Internally used model bound to the PrimeNG datepicker
   * Converts `selectedDate` (string) into `Date` object.
   * Must be a writable signal for two-way binding with PrimeNG.
   */
  modelDate = signal<Date | undefined>(undefined);

  /**
   * Effective minimum date - defaults to today if no minDate provided
   */
  effectiveMinDate = computed(() => {
    const min = this.minDate();
    if (min?.getHours() === 0 && min.getMinutes() === 0 && min.getSeconds() === 0 && min.getMilliseconds() === 0) {
      return min;
    }
    const base = min ?? new Date();
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  /**
   * Current language signal - updated when language changes
   */
  currentLanguage = signal<string>('en');

  /**
   * Computed date format based on current language signal
   * English: 'dd/mm/yy' (with slashes)
   * German: 'dd.mm.yy' (with dots)
   */
  dateFormat = computed(() => {
    const currentLang = this.currentLanguage();
    return currentLang === 'en' ? 'dd/mm/yy' : 'dd.mm.yy';
  });

  private scrollListener?: (event: Event) => void;
  private translateService = inject(TranslateService);

  /**
   * Effect to sync modelDate and handle language changes
   */
  private syncModelDateAndLanguage = effect(onCleanup => {
    // Sync modelDate whenever selectedDate input changes
    try {
      const value = this.selectedDate();
      this.modelDate.set(parseLocalDateString(value));
    } catch {
      this.modelDate.set(undefined);
    }

    // Set initial language and listen for changes
    this.currentLanguage.set(this.translateService.getCurrentLang() || 'en');

    const subscription = this.translateService.onLangChange.subscribe(event => {
      this.currentLanguage.set(event.lang);
    });

    onCleanup(() => subscription.unsubscribe());
  });

  /**
   * Effect to setup scroll event listener with automatic cleanup
   */
  private setupScrollListener = effect(onCleanup => {
    const isOpen = this.isCalendarOpen();

    if (isOpen) {
      // When calendar is open, prevent scroll events from closing it
      this.scrollListener = (event: Event) => {
        // Check if the scroll is happening within the datepicker panel
        const target = event.target as Element;
        const datepickerPanel = document.querySelector('.p-datepicker');

        if (datepickerPanel && (datepickerPanel.contains(target) || target === datepickerPanel)) {
          // Allow scrolling within the datepicker panel
          return;
        }

        // For other scroll events, prevent the default behavior that closes the datepicker
        event.stopPropagation();
      };

      // Add the listener in the capture phase to intercept scroll events early
      document.addEventListener('scroll', this.scrollListener, true);
    } else if (this.scrollListener) {
      // Remove listener when calendar is closed
      document.removeEventListener('scroll', this.scrollListener, true);
      this.scrollListener = undefined;
    }

    // Cleanup when component is destroyed
    onCleanup(() => {
      if (this.scrollListener) {
        document.removeEventListener('scroll', this.scrollListener, true);
      }
    });
  });

  /**
   * Converts a Date object to ISO date string and emits it as `selectedDateChange`.
   * @param date - The Date object selected by the user
   */
  onDateChange(date: Date | undefined): void {
    if (date) {
      const year = date.getFullYear().toString().padStart(4, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      this.selectedDateChange.emit(localDate);

      setTimeout(() => {
        this.modelDate.set(date);
      }, 0);
    } else {
      this.modelDate.set(undefined);
      this.selectedDateChange.emit(undefined);
    }
  }

  isHighlightedDate(date: DatePickerDateMeta): boolean {
    const highlightedDate = this.highlightedDate();
    if (!highlightedDate) {
      return false;
    }

    return (
      date.year === highlightedDate.getFullYear() && date.month === highlightedDate.getMonth() && date.day === highlightedDate.getDate()
    );
  }
}

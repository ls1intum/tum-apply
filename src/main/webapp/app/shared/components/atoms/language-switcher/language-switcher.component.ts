import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core'; // Change model to output
import { TranslateDirective } from 'app/shared/language';

export type Language = 'en' | 'de';

@Component({
  selector: 'jhi-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateDirective],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  currentLang = input<Language>('en'); // Use input only
  disabled = input<boolean>(false);
  languageChange = output<Language>(); // Notify parent instead of setting directly

  setLanguage(lang: Language): void {
    if (lang === this.currentLang() || this.disabled()) {
      return;
    }
    this.languageChange.emit(lang); // Emit the event to the parent
  }
}

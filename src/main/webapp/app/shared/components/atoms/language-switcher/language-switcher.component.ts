import { CommonModule } from '@angular/common';
import { Component, input, model } from '@angular/core';
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
  currentLang = model<Language>('en');
  disabled = input<boolean>(false);

  setLanguage(lang: Language): void {
    if (lang === this.currentLang() || this.disabled()) {
      return;
    }
    this.currentLang.set(lang);
  }
}

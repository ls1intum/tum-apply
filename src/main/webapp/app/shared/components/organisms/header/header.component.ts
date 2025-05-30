import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, TranslateModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  isDarkMode = signal(document.body.classList.contains('tum-apply-dark-mode'));
  currentLanguage = 'EN';
  languages = LANGUAGES.map(lang => lang.toUpperCase());

  constructor(private translateService: TranslateService) {}

  toggleColorScheme(): void {
    const className = 'tum-apply-dark-mode';
    document.body.classList.toggle(className);
    this.isDarkMode.set(document.body.classList.contains(className));
  }

  toggleLanguage(language: string): void {
    if (this.languages.includes(language)) {
      this.currentLanguage = language;
      this.translateService.use(language.toLowerCase());
    } else {
      console.warn(`Unsupported language: ${language}`);
    }
  }
}

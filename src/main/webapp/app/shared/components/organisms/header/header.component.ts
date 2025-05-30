import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AccountService } from 'app/core/auth/account.service';

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
  accountService = inject(AccountService);
  user = this.accountService.user;

  constructor(
    private translateService: TranslateService,
    private router: Router,
  ) {}

  navigateToHome(): void {
    void this.router.navigate(['/']);
  }

  navigateToLogin(): void {
    void this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    void this.router.navigate(['/register']);
  }

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

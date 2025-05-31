import { Component, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { User } from 'app/core/auth/account.model';
import { AccountService } from 'app/core/auth/account.service';

import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, FontAwesomeModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  isDarkMode = signal(document.body.classList.contains('tum-apply-dark-mode'));
  currentLanguage = 'EN';
  languages = LANGUAGES.map(lang => lang.toUpperCase());
  accountService = inject(AccountService);
  user: WritableSignal<User | undefined> = this.accountService.user;

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

  logout(): void {
    this.accountService.signOut();
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

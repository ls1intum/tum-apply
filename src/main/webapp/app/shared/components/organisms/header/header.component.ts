import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { keycloakService } from 'app/core/auth/keycloak.service';

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
  userFirstName = signal<string | null>(null);
  isLoggedIn = signal(keycloakService.isLoggedIn());

  constructor(
    private translateService: TranslateService,
    private router: Router,
  ) {
    effect(() => {
      this.isLoggedIn.set(keycloakService.isLoggedIn());
      this.loadUserDetails();
    });
  }

  navigateToHome(): void {
    void this.router.navigate(['/']);
  }

  navigateToLogin(): void {
    console.warn('Navigating to login');
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

  private loadUserDetails(): void {
    if (this.isLoggedIn()) {
      this.userFirstName.set(keycloakService.getFirstName());
    } else {
      this.userFirstName.set(null);
    }
  }
}

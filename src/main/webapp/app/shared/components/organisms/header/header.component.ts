import { Component, ViewEncapsulation, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavigationEnd, Router } from '@angular/router';
import { AccountService, User } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter, fromEventPattern, map } from 'rxjs';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { PrimeNG } from 'primeng/config';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { AuthDialogService } from 'app/core/auth/auth-dialog.service';
import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';

import { ButtonComponent } from '../../atoms/button/button.component';
import { SelectComponent, SelectOption } from '../../atoms/select/select.component';
import TranslateDirective from '../../../language/translate.directive';
import { TUMApplyPreset } from '../../../../../content/theming/tumapplypreset';
import { BlossomTheme } from '../../../../../content/theming/custompreset';

type ThemeOption = 'light' | 'dark' | 'blossom';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, SelectComponent, FontAwesomeModule, TranslateModule, DynamicDialogModule, TranslateDirective],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  bodyClassChanges$ = fromEventPattern<MutationRecord[]>(handler => {
    const observer = new MutationObserver(handler as MutationCallback);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }).pipe(map(() => document.documentElement.classList.contains('tum-apply-dark-mode')));
  isDarkMode = toSignal(this.bodyClassChanges$, {
    initialValue: document.documentElement.classList.contains('tum-apply-dark-mode'),
  });
  translateService = inject(TranslateService);
  currentLanguage = toSignal(this.translateService.onLangChange.pipe(map(event => event.lang.toUpperCase())), {
    initialValue: this.translateService.getCurrentLang() ? this.translateService.getCurrentLang().toUpperCase() : 'EN',
  });
  languages = LANGUAGES.map(lang => lang.toUpperCase());
  accountService = inject(AccountService);
  user: WritableSignal<User | undefined> = this.accountService.user;
  router = inject(Router);
  theme = signal<ThemeOption>(this.getInitialTheme());

  themeOptions: SelectOption[] = [
    { name: 'Light', value: 'light' },
    { name: 'Dark', value: 'dark' },
    { name: 'Blossom', value: 'blossom' },
  ];

  selectedTheme = computed(() => this.themeOptions.find(opt => opt.value === this.theme()));

  routeAuthorities = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) route = route.firstChild;
        const data = route.data as any;
        return data?.['authorities'] ?? [];
      }),
    ),
    {
      initialValue: (() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) route = route.firstChild;
        const data = route.data as any;
        return data?.['authorities'] ?? [];
      })(),
    },
  );
  isProfessorPage = computed(() => {
    const auths = this.routeAuthorities();
    return (
      (this.router.url === '/professor' && !this.accountService.hasAnyAuthority(['APPLICANT'])) ||
      this.accountService.hasAnyAuthority(['PROFESSOR']) ||
      (Array.isArray(auths) && auths.includes(UserShortDTO.RolesEnum.Professor))
    );
  });

  private authFacadeService = inject(AuthFacadeService);
  private authDialogService = inject(AuthDialogService);
  private primeNG = inject(PrimeNG);
  private readonly rootElement = document.documentElement;

  constructor() {
    this.setTheme(this.theme());
  }

  getInitialTheme(): ThemeOption {
    const stored = localStorage.getItem('tumApplyTheme') as ThemeOption | null;

    if (stored === 'dark' || stored === 'blossom' || stored === 'light') {
      return stored;
    }
    const classList = document.documentElement.classList;
    if (classList.contains('tum-apply-blossom')) {
      return 'blossom';
    }
    if (classList.contains('tum-apply-dark-mode')) {
      return 'dark';
    }
    return 'light';
  }

  navigateToHome(): void {
    if (this.accountService.hasAnyAuthority(['PROFESSOR']) || this.router.url === '/professor') {
      this.redirectToProfessorLandingPage();
    } else {
      this.redirectToApplicantLandingPage();
    }
  }

  login(): void {
    if (this.isProfessorPage()) {
      void this.onTUMSSOLogin();
    } else {
      this.openLoginDialog();
    }
  }

  openLoginDialog(): void {
    this.authDialogService.open({
      mode: 'login',
    });
  }

  redirectToProfessorLandingPage(): void {
    void this.router.navigate(['/professor']);
  }

  redirectToApplicantLandingPage(): void {
    void this.router.navigate(['/']);
  }

  async onTUMSSOLogin(): Promise<void> {
    await this.authFacadeService.loginWithProvider(IdpProvider.TUM, this.router.url);
  }

  logout(): void {
    void this.authFacadeService.logout();
  }

  setTheme(theme: ThemeOption): void {
    this.theme.set(theme);

    const root = this.rootElement;

    // Disable transitions/animations before changing theme
    root.classList.add('theme-switching');

    root.classList.remove('tum-apply-dark-mode', 'tum-apply-blossom');

    const themeOptions = {
      darkModeSelector: '.tum-apply-dark-mode',
      cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
    };

    if (theme === 'blossom') {
      this.primeNG.theme.set({ preset: BlossomTheme, options: themeOptions });
      root.classList.add('tum-apply-blossom');
    } else {
      this.primeNG.theme.set({ preset: TUMApplyPreset, options: themeOptions });
      if (theme === 'dark') {
        root.classList.add('tum-apply-dark-mode');
      }
    }

    localStorage.setItem('tumApplyTheme', theme);

    // allow one frame for styles to apply, then restore transitions
    window.requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
  }

  onThemeChange(option: SelectOption): void {
    this.setTheme(option.value as ThemeOption);
  }

  toggleLanguage(language: string): void {
    if (this.languages.includes(language)) {
      this.translateService.use(language.toLowerCase());
    } else {
      console.warn(`Unsupported language: ${language}`);
    }
  }
}

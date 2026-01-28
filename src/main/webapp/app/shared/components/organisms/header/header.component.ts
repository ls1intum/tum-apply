import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  WritableSignal,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavigationEnd, Router } from '@angular/router';
import { AccountService, User } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter, map } from 'rxjs';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { AuthDialogService } from 'app/core/auth/auth-dialog.service';
import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import { ThemeService } from 'app/service/theme.service';

import { ButtonComponent } from '../../atoms/button/button.component';
import { SelectOption } from '../../atoms/select/select.component';
import TranslateDirective from '../../../language/translate.directive';
import { JhiMenuItem, MenuComponent } from '../../atoms/menu/menu.component';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, FontAwesomeModule, TranslateModule, DynamicDialogModule, TranslateDirective, MenuComponent],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  translateService = inject(TranslateService);
  currentLanguage = toSignal(this.translateService.onLangChange.pipe(map(event => event.lang.toUpperCase())), {
    initialValue: this.translateService.getCurrentLang() ? this.translateService.getCurrentLang().toUpperCase() : 'EN',
  });
  languages = LANGUAGES.map(lang => lang.toUpperCase());
  accountService = inject(AccountService);
  user: WritableSignal<User | undefined> = this.accountService.user;
  router = inject(Router);
  themeService = inject(ThemeService);
  theme = this.themeService.theme;
  syncWithSystem = this.themeService.syncWithSystem;
  isDarkMode = computed(() => this.theme() === 'dark');
  showBorder = signal(false);
  themeIcon = computed(() => {
    if (this.syncWithSystem()) {
      return 'custom-sun-moon';
    }
    return this.isDarkMode() ? 'moon' : 'custom-sun';
  });
  themeTooltip = computed(() => {
    if (this.syncWithSystem()) {
      return 'header.systemMode';
    }
    return this.isDarkMode() ? 'header.darkMode' : 'header.lightMode';
  });
  themeOptions: SelectOption[] = [
    { name: 'Light', value: 'light' },
    { name: 'Dark', value: 'dark' },
    { name: 'Blossom', value: 'blossom' },
    { name: 'AquaBloom', value: 'aquabloom' },
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

  readonly headerButtonClass =
    'inline-flex [&_.p-button]:min-w-[6.3rem] [&_.p-button]:h-8 [&_.p-button]:justify-center [&_.p-button]:px-3 [&_.p-button]:py-[0.4rem] [&_.p-button]:text-[0.9rem] [&_.p-button]:rounded-md';

  profileMenu = viewChild<MenuComponent>('profileMenu');
  isProfileMenuOpen = signal(false);

  profileMenuItems = computed<JhiMenuItem[]>(() => {
    this.currentLanguage();
    if (!this.user()) {
      return [];
    }

    return [
      {
        label: 'header.settings',
        icon: 'gear',
        severity: 'primary',
        command: () => {
          this.navigateToSettings();
        },
      },
      {
        label: 'header.logout',
        icon: 'right-from-bracket',
        severity: 'danger',
        command: () => {
          this.logout();
        },
      },
    ];
  });

  private destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;
  private authFacadeService = inject(AuthFacadeService);
  private authDialogService = inject(AuthDialogService);

  constructor() {
    afterNextRender(() => {
      this.setupBannerObserver();
    });

    // Re-setup on navigation
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.observer?.disconnect();
        // Give the banner component time to render
        setTimeout(() => {
          this.setupBannerObserver();
        }, 0);
      });

    this.destroyRef.onDestroy(() => this.observer?.disconnect());
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

  onThemeChange(option: SelectOption): void {
    this.themeService.setTheme(option.value as 'light' | 'dark' | 'blossom' | 'aquabloom');
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleLanguage(language: string): void {
    if (this.languages.includes(language)) {
      this.translateService.use(language.toLowerCase());
    } else {
      console.warn(`Unsupported language: ${language}`);
    }
  }

  navigateToSettings(): void {
    void this.router.navigate(['/settings']);
  }

  toggleProfileMenu(event: Event): void {
    this.isProfileMenuOpen.update(state => !state);
    this.profileMenu()?.toggle(event);
  }

  private setupBannerObserver(): void {
    const banner = document.querySelector('jhi-banner-section');
    const isLandingPage = this.router.url === '/' || this.router.url === '/professor';

    if (!isLandingPage) {
      // Other pages: always show border
      this.showBorder.set(true);
      return;
    }

    // Landing pages with banner: show border only when scrolled past banner
    if (!banner) {
      // No banner on landing page: show border
      this.showBorder.set(true);
      return;
    }

    // Start with border hidden (banner is visible at top)
    this.showBorder.set(false);

    // Show border when banner scrolls out of view
    this.observer = new IntersectionObserver(([entry]) => {
      this.showBorder.set(!entry.isIntersecting);
    });
    this.observer.observe(banner);
  }
}

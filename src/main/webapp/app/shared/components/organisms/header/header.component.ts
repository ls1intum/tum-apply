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
import { filter, fromEventPattern, map } from 'rxjs';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { AuthDialogService } from 'app/core/auth/auth-dialog.service';
import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import { Popover } from 'primeng/popover';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { ThemeService } from 'app/service/theme.service';

import { ButtonComponent } from '../../atoms/button/button.component';
import { SelectOption } from '../../atoms/select/select.component';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    FontAwesomeModule,
    TranslateModule,
    DynamicDialogModule,
    TranslateDirective,
    Popover,
    ToggleSwitch,
    FormsModule,
  ],
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
  themeService = inject(ThemeService);
  theme = this.themeService.theme;
  syncWithSystem = this.themeService.syncWithSystem;
  themePopover = viewChild<Popover>('popover');
  isOverButton = signal<boolean>(false);
  isOverPopover = signal<boolean>(false);
  showBorder = signal(false);
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
        const data = route.data as Record<string, unknown>;
        return data.authorities ?? [];
      }),
    ),
    {
      initialValue: (() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) route = route.firstChild;
        const data = route.data as Record<string, unknown>;
        return data.authorities ?? [];
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

  private destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;
  private authFacadeService = inject(AuthFacadeService);
  private authDialogService = inject(AuthDialogService);
  private popoverTimeout?: number;

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

  onSyncWithSystemChange(value: boolean): void {
    this.themeService.setSyncWithSystem(value);
  }

  onThemeAreaEnter(): void {
    this.isOverButton.set(true);
    this.clearPopoverTimeout();
  }

  onThemeAreaLeave(): void {
    this.isOverButton.set(false);
    this.checkAndHidePopover();
  }

  onThemeButtonEnter(event: Event): void {
    const popover = this.themePopover();
    popover?.show(event);

    // Attach event listeners to popover container after it's shown
    if (popover) {
      setTimeout(() => {
        const container = popover.container;
        if (container) {
          // Remove old listeners if they exist
          container.onmouseenter = () => {
            this.isOverPopover.set(true);
            this.clearPopoverTimeout();
          };
          container.onmouseleave = () => {
            this.isOverPopover.set(false);
            this.checkAndHidePopover();
          };
        }
      }, 0);
    }
  }

  toggleLanguage(language: string): void {
    if (this.languages.includes(language)) {
      this.translateService.use(language.toLowerCase());
    } else {
      console.warn(`Unsupported language: ${language}`);
    }
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

  private clearPopoverTimeout(): void {
    if (this.popoverTimeout !== undefined) {
      clearTimeout(this.popoverTimeout);
      this.popoverTimeout = undefined;
    }
  }

  private checkAndHidePopover(): void {
    this.clearPopoverTimeout();
    this.popoverTimeout = window.setTimeout(() => {
      if (!this.isOverButton() && !this.isOverPopover()) {
        this.themePopover()?.hide();
      }
    }, 200);
  }
}

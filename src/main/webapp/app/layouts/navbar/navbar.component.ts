import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { StateStorageService } from 'app/core/auth/state-storage.service';
import SharedModule from 'app/shared/shared.module';
import HasAnyAuthorityDirective from 'app/shared/auth/has-any-authority.directive';
import { LANGUAGES } from 'app/config/language.constants';
import { AccountService } from 'app/core/auth/account.service';
import { LoginService } from 'app/pages/usermanagement/login/login.service';
import { ProfileService } from 'app/layouts/profiles/profile.service';
import { EntityNavbarItems } from 'app/entities/entity-navbar-items';
import { SessionStorageService } from 'ngx-webstorage';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { VERSION } from '../../app.constants';

import ActiveMenuDirective from './active-menu.directive';
import NavbarItem from './navbar-item.model';

@Component({
  selector: 'jhi-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  imports: [RouterModule, SharedModule, HasAnyAuthorityDirective, ActiveMenuDirective, MenuModule, ButtonModule, RippleModule],
})
export default class NavbarComponent implements OnInit {
  inProduction?: boolean;
  isNavbarCollapsed = signal(true);
  languages = LANGUAGES;
  openAPIEnabled?: boolean;
  version = '';
  account = inject(AccountService).trackCurrentAccount();
  entitiesNavbarItems: MenuItem[] = [];
  adminNavItems: MenuItem[] = [];
  languageNavItems: MenuItem[] = [];
  accountNavItems: MenuItem[] = [];

  private readonly loginService = inject(LoginService);
  private readonly translateService = inject(TranslateService);
  private readonly stateStorageService = inject(StateStorageService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly sessionStorage = inject(SessionStorageService);

  constructor() {
    this.version = VERSION;
    const savedTheme = this.sessionStorage.retrieve('theme') ?? 'light';
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
  }

  ngOnInit(): void {
    // Convert entity navbar items to PrimeNG MenuItem format
    this.entitiesNavbarItems = this.convertNavbarItemsToMenuItems(EntityNavbarItems);

    // Create admin menu items
    this.adminNavItems = [
      {
        label: this.translateService.instant('global.menu.entities.adminAuthority'),
        icon: 'pi pi-fw pi-star',
        command: () => {
          this.router.navigate(['/authority']);
          this.collapseNavbar();
        },
      },
      {
        label: this.translateService.instant('global.menu.admin.metrics'),
        icon: 'pi pi-fw pi-chart-bar',
        command: () => {
          this.router.navigate(['/admin/metrics']);
          this.collapseNavbar();
        },
      },
      {
        label: this.translateService.instant('global.menu.admin.health'),
        icon: 'pi pi-fw pi-heart',
        command: () => {
          this.router.navigate(['/admin/health']);
          this.collapseNavbar();
        },
      },
      {
        label: this.translateService.instant('global.menu.admin.configuration'),
        icon: 'pi pi-fw pi-cog',
        command: () => {
          this.router.navigate(['/admin/configuration']);
          this.collapseNavbar();
        },
      },
      {
        label: this.translateService.instant('global.menu.admin.logs'),
        icon: 'pi pi-fw pi-list',
        command: () => {
          this.router.navigate(['/admin/logs']);
          this.collapseNavbar();
        },
      },
    ];

    // Add API docs menu item if enabled
    this.profileService.getProfileInfo().subscribe(profileInfo => {
      this.inProduction = profileInfo.inProduction;
      this.openAPIEnabled = profileInfo.openAPIEnabled;

      if (this.openAPIEnabled) {
        this.adminNavItems.push({
          label: this.translateService.instant('global.menu.admin.apidocs'),
          icon: 'pi pi-fw pi-book',
          command: () => {
            this.router.navigate(['/admin/docs']);
            this.collapseNavbar();
          },
        });
      }
    });

    // Create language menu items
    this.languageNavItems = this.languages.map(lang => ({
      label: this.findLanguageFromKey(lang),
      command: () => {
        this.changeLanguage(lang);
        this.collapseNavbar();
      },
    }));

    // Set up account menu items depending on auth status
    this.updateAccountMenu();
  }

  changeLanguage(languageKey: string): void {
    this.stateStorageService.storeLocale(languageKey);
    this.translateService.use(languageKey);
  }

  collapseNavbar(): void {
    this.isNavbarCollapsed.set(true);
  }

  login(): void {
    this.loginService.login();
  }

  logout(): void {
    this.collapseNavbar();
    this.loginService.logout();
    this.router.navigate(['']);
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed.update(isNavbarCollapsed => !isNavbarCollapsed);
  }

  toggleTheme(): void {
    const currentTheme = this.sessionStorage.retrieve('theme');
    const isDark = currentTheme === 'dark';

    const newTheme = isDark ? 'light' : 'dark';
    const themeId = 'app-theme';
    const themeLink = document.getElementById(themeId) as HTMLLinkElement | null;

    if (themeLink) {
      themeLink.href = `assets/themes/lara-${newTheme}-blue/theme.css`;
    } else {
      const link = document.createElement('link');
      link.id = themeId;
      link.rel = 'stylesheet';
      link.href = `assets/themes/lara-${newTheme}-blue/theme.css`;
      document.head.appendChild(link);
    }

    // Update Tailwind class
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${newTheme}-theme`);

    // Save new theme
    this.sessionStorage.store('theme', newTheme);
  }

  private convertNavbarItemsToMenuItems(items: NavbarItem[]): MenuItem[] {
    return items.map(item => ({
      label: this.translateService.instant(item.name),
      icon: 'pi pi-fw pi-circle',
      command: () => {
        this.router.navigate([item.route]);
        this.collapseNavbar();
      },
    }));
  }

  private updateAccountMenu(): void {
    if (this.account()) {
      this.accountNavItems = [
        {
          label: this.translateService.instant('global.menu.account.logout'),
          icon: 'pi pi-fw pi-sign-out',
          command: () => this.logout(),
        },
      ];
    } else {
      this.accountNavItems = [
        {
          label: this.translateService.instant('global.menu.account.login'),
          icon: 'pi pi-fw pi-sign-in',
          command: () => this.login(),
        },
      ];
    }
  }

  private findLanguageFromKey(key: string): string {
    // This is a simple implementation - you might want to improve this
    const languageNames: Record<string, string> = {
      en: 'English',
      de: 'Deutsch',
    };
    return languageNames[key] || key;
  }
}

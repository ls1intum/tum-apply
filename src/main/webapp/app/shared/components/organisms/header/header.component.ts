import { Component, ViewEncapsulation, WritableSignal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavigationEnd, Router } from '@angular/router';
import { AccountService, User } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter, fromEventPattern, map } from 'rxjs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { UserShortDTO } from 'app/generated/model/userShortDTO';

import { ButtonComponent } from '../../atoms/button/button.component';
import { AuthCardComponent } from '../auth-card/auth-card.component';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, FontAwesomeModule, TranslateModule, DynamicDialogModule, TranslateDirective],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  bodyClassChanges$ = fromEventPattern<MutationRecord[]>(handler => {
    const observer = new MutationObserver(handler as MutationCallback);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }).pipe(map(() => document.body.classList.contains('tum-apply-dark-mode')));
  isDarkMode = toSignal(this.bodyClassChanges$, {
    initialValue: document.body.classList.contains('tum-apply-dark-mode'),
  });
  translateService = inject(TranslateService);
  currentLanguage = toSignal(this.translateService.onLangChange.pipe(map(event => event.lang.toUpperCase())), {
    initialValue: this.translateService.currentLang ? this.translateService.currentLang.toUpperCase() : 'EN',
  });
  languages = LANGUAGES.map(lang => lang.toUpperCase());
  accountService = inject(AccountService);
  user: WritableSignal<User | undefined> = this.accountService.user;
  ref: DynamicDialogRef | undefined;
  router = inject(Router);

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

  private dialogService = inject(DialogService);
  private authFacadeService = inject(AuthFacadeService);

  navigateToHome(): void {
    if (this.accountService.hasAnyAuthority(['PROFESSOR'])) {
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
    this.ref = this.dialogService.open(AuthCardComponent, {
      style: {
        border: 'none',
        overflow: 'auto',
        background: 'transparent',
        boxShadow: 'none',
      },
      data: {
        professor: this.isProfessorPage(),
        redirectUri: this.router.url,
      },
      modal: true,
      contentStyle: {
        padding: '0',
      },
      dismissableMask: true,
      closeOnEscape: true,
      showHeader: false,
    });
  }

  redirectToProfessorLandingPage(): void {
    void this.router.navigate(['/professor']);
  }

  redirectToApplicantLandingPage(): void {
    void this.router.navigate(['/']);
  }

  async onTUMSSOLogin(): Promise<void> {
    await this.authFacadeService.loginWithTUM(this.router.url);
  }

  logout(): void {
    const redirectUri = this.isProfessorPage() ? '/professor' : '/';
    void this.authFacadeService.logout(redirectUri);
  }

  /*  toggleColorScheme(): void {
            const className = 'tum-apply-dark-mode';
            document.body.classList.toggle(className);
          }*/

  toggleLanguage(language: string): void {
    if (this.languages.includes(language)) {
      this.translateService.use(language.toLowerCase());
    } else {
      console.warn(`Unsupported language: ${language}`);
    }
  }
}

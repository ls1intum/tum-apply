import { Component, ViewEncapsulation, WritableSignal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AccountService, User } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fromEventPattern, map } from 'rxjs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';

import { ButtonComponent } from '../../atoms/button/button.component';
import { AuthCardComponent } from '../auth-card/auth-card.component';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, FontAwesomeModule, TranslateModule, DynamicDialogModule],
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

  private router = inject(Router);
  private dialogService = inject(DialogService);
  private authFacadeService = inject(AuthFacadeService);

  navigateToHome(): void {
    void this.router.navigate(['/']);
  }

  openLoginDialog(): void {
    this.ref = this.dialogService.open(AuthCardComponent, {
      style: {
        border: 'none',
        overflow: 'auto',
        background: 'transparent',
        boxShadow: 'none',
      },
      data: { mode: 'login', redirectUri: this.router.url },
      modal: true,
      contentStyle: {
        padding: '0',
      },
      dismissableMask: true,
      closeOnEscape: true,
      showHeader: false,
    });
  }

  logout(): void {
    void this.authFacadeService.logout();
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

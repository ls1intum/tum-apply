import { Component, ViewEncapsulation, WritableSignal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LANGUAGES } from 'app/config/language.constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AccountService, User } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fromEventPattern, map } from 'rxjs';

import { ButtonComponent } from '../../atoms/button/button.component';
import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';
import { AuthDialogService } from '../../../auth/ui/auth-dialog.service';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, FontAwesomeModule, TranslateModule],
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

  private router = inject(Router);
  private authFacadeService = inject(AuthFacadeService);
  private authDialogService = inject(AuthDialogService);

  navigateToHome(): void {
    void this.router.navigate(['/']);
  }

  openLoginDialog(): void {
    this.authDialogService.open({
      mode: 'login',
      onSuccess() {
        // TODO: reload or show toast
      },
    });
  }

  logout(): void {
    void this.authFacadeService.logout();
  }

  /*
  toggleColorScheme(): void {
    const className = 'tum-apply-dark-mode';
    document.body.classList.toggle(className);
  }
  */

  toggleLanguage(language: string): void {
    if (this.languages.includes(language)) {
      this.translateService.use(language.toLowerCase());
    } else {
      console.warn(`Unsupported language: ${language}`);
    }
  }
}

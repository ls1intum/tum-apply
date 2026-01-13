import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AccountService, User } from 'app/core/auth/account.service';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';

@Component({
  selector: 'jhi-profile-menu',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateModule, Menu],
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProfileMenuComponent {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private authFacadeService = inject(AuthFacadeService);
  private translateService = inject(TranslateService);

  user = this.accountService.user;

  private currentLanguage = toSignal(this.translateService.onLangChange.pipe(map(event => event.lang.toUpperCase())), {
    initialValue: this.translateService.getCurrentLang() ? this.translateService.getCurrentLang().toUpperCase() : 'EN',
  });

  profileMenuItems = computed<MenuItem[]>(() => {
    this.currentLanguage();
    if (!this.user()) {
      return [];
    }

    return [
      {
        label: this.translateService.instant('header.settings'),
        icon: 'gear',
        command: () => {
          this.navigateToSettings();
        },
      },
      {
        separator: true,
      },
      {
        label: this.translateService.instant('header.logout'),
        icon: 'right-from-bracket',
        command: () => {
          this.logout();
        },
      },
    ];
  });

  navigateToSettings(): void {
    void this.router.navigate(['/settings']);
  }

  logout(): void {
    void this.authFacadeService.logout();
  }
}

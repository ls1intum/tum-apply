import { Component, computed, inject, input, output } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PanelModule } from 'primeng/panel';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { SidebarButtonComponent } from '../../atoms/sidebar-button/sidebar-button.component';
import TranslateDirective from '../../../language/translate.directive';

type SidebarButton = { icon: string; text: string; link: string };
type SidebarCategory = { title: string; buttons: SidebarButton[] };

@Component({
  selector: 'jhi-sidebar',
  imports: [ButtonModule, DividerModule, PanelModule, SidebarButtonComponent, TranslateModule, TranslateDirective],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  isSidebarCollapsed = input.required<boolean>();
  sidebarCollapsedChange = output<boolean>();

  readonly categories = computed<SidebarCategory[]>(() => {
    const authorities = this.accountService.user()?.authorities ?? [];
    return authorities.flatMap(a => this.categoryConfig[a as UserShortDTO.RolesEnum] ?? []);
  });

  private readonly customGroups: Partial<Record<string, string[]>> = {
    '/application/overview': ['/application/detail', '/application/form'],
    '/job-overview': ['/job/detail'],
    '/my-positions': ['/job/detail', '/job/edit'],
  };

  private accountService = inject(AccountService);
  private router = inject(Router);

  private readonly categoryConfig: Record<string, SidebarCategory[]> = {
    APPLICANT: [
      {
        title: 'sidebar.dashboard.dashboard',
        buttons: [
          { icon: 'home', text: 'sidebar.dashboard.home', link: '/' },
          { icon: 'briefcase', text: 'sidebar.dashboard.findpositions', link: '/job-overview' },
        ],
      },
      {
        title: 'sidebar.applications.applications',
        buttons: [{ icon: 'file', text: 'sidebar.applications.myapplications', link: '/application/overview' }],
      },
    ],
    PROFESSOR: [
      // ...
    ],
    ADMIN: [
      // ...
    ],
  };

  isActive(link: string): boolean {
    const currentPath = this.getCurrentPath();

    if (link === '/') return currentPath === '/';

    const subPaths = this.customGroups[link];
    if (subPaths) {
      if (this.pathMatches(link, currentPath)) return true;
      return subPaths.some(sp => this.pathMatches(sp, currentPath));
    }

    return this.pathMatches(link, currentPath);
  }

  toggleSidebar(): void {
    this.sidebarCollapsedChange.emit(!this.isSidebarCollapsed());
  }

  private getCurrentPath(): string {
    return this.router.url.split('?')[0].split(';')[0];
  }

  private pathMatches(base: string, current: string): boolean {
    return current === base || current.startsWith(base + '/');
  }
}

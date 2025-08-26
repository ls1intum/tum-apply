import { Component, inject } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PanelModule } from 'primeng/panel';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';

import { SidebarButtonComponent } from '../../atoms/sidebar-button/sidebar-button.component';

type SidebarButton = { icon: string; text: string; link: string };
type SidebarCategory = { title: string; buttons: SidebarButton[] };

@Component({
  selector: 'jhi-sidebar',
  imports: [DividerModule, PanelModule, SidebarButtonComponent, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private accountService = inject(AccountService);
  private router = inject(Router);

  /**
   * Custom groups for sidebar links that have multiple paths.
   * This allows for more flexible matching of active links.
   */
  private readonly customGroups: Partial<Record<string, string[]>> = {
    '/application/overview': ['/application/detail', '/application/form'],
    '/job-overview': ['/job/detail', '/application/form'],
    '/my-positions': ['/job/detail', '/job/edit'],
  };

  /**
   * Returns the categories for the sidebar based on the user's roles.
   * The categories are defined in the getCategoryConfig method.
   */
  get categories(): SidebarCategory[] | undefined {
    const categoryConfig = this.getCategoryConfig();
    const authorities = this.accountService.user()?.authorities;
    return authorities?.map((authority: string) => categoryConfig[authority as UserShortDTO.RolesEnum]).flat();
  }

  /**
   * Checks if the given link is active based on the current router URL.
   * It also checks against custom groups for more complex matching.
   * @param link The link to check for activity.
   * @returns True if the link is active, false otherwise.
   */
  isActive(link: string): boolean {
    const currentPath = this.router.url.split('?')[0].split(';')[0];

    // If the link is the root path, check if the current path is also the root
    if (link === '/') {
      return currentPath === '/';
    }

    // Check if the link is in the custom groups
    const subPaths = this.customGroups[link];
    if (subPaths) {
      if (currentPath === link || currentPath.startsWith(link + '/')) {
        return true;
      }
      return subPaths.some(subPath => currentPath === subPath || currentPath.startsWith(subPath + '/'));
    }

    return currentPath === link || currentPath.startsWith(link + '/');
  }

  private getCategoryConfig(): Record<string, SidebarCategory[]> {
    return {
      APPLICANT: [
        {
          title: 'sidebar.dashboard.dashboard',
          buttons: [
            { icon: 'home', text: 'sidebar.dashboard.home', link: '/' },
            { icon: 'search', text: 'sidebar.dashboard.findpositions', link: '/job-overview' },
          ],
        },
        {
          title: 'sidebar.applications.applications',
          buttons: [
            {
              icon: 'file',
              text: 'sidebar.applications.myapplications',
              link: '/application/overview',
            },
          ],
        },
      ],
      PROFESSOR: [
        {
          title: 'sidebar.manage.manage',
          buttons: [
            { icon: 'home', text: 'sidebar.manage.home', link: '/' },
            { icon: 'list', text: 'sidebar.manage.mypositions', link: '/my-positions' },
            { icon: 'plus', text: 'sidebar.manage.createposition', link: '/job/create' },
          ],
        },
        {
          title: 'sidebar.applications.applications',
          buttons: [
            {
              icon: 'table-list',
              text: 'sidebar.applications.applicationoverview',
              link: '/evaluation/overview',
            },
            {
              icon: 'id-card',
              text: 'sidebar.applications.reviewapplications',
              link: '/evaluation/application',
            },
          ],
        },
        {
          title: 'sidebar.researchgroup.emailtemplates',
          buttons: [{ icon: 'envelope-open-text', text: 'sidebar.researchgroup.emailtemplates', link: '/research-group/templates' }],
        },
      ],
      ADMIN: [
        {
          title: 'sidebar.dashboard.dashboard',
          buttons: [
            { icon: 'home', text: 'sidebar.dashboard.home', link: '/' },
            { icon: 'chart-line', text: 'sidebar.dashboard.analytics', link: '/analytics' },
          ],
        },
        {
          title: 'sidebar.content.content',
          buttons: [
            { icon: 'folder', text: 'sidebar.content.allpositions', link: '/all-positions' },
            { icon: 'microscope', text: 'sidebar.content.researchgroups', link: '/research-groups' },
          ],
        },
        {
          title: 'sidebar.users.users',
          buttons: [
            { icon: 'users', text: 'sidebar.users.manageusers', link: '/manage-users' },
            { icon: 'file', text: 'sidebar.users.file', link: '/applications' },
          ],
        },
        {
          title: 'sidebar.system.system',
          buttons: [{ icon: 'wrench', text: 'sidebar.system.systemsettings', link: '/system-settings' }],
        },
      ],
    };
  }
}

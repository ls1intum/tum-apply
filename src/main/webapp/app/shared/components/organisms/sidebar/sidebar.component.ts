import { Component } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PanelModule } from 'primeng/panel';
import { Router } from '@angular/router';

import { SidebarButtonComponent } from '../../atoms/sidebar-button/sidebar-button.component';

@Component({
  selector: 'jhi-sidebar',
  imports: [PanelModule, SidebarButtonComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  constructor(
    private accountService: AccountService,
    private router: Router,
  ) {}

  get categories(): { title: string; buttons: { icon: string; text: string; link: string }[] }[] | undefined {
    const categoryConfig = {
      APPLICANT: [
        {
          title: 'Dashboard',
          buttons: [
            { icon: 'home', text: 'Home', link: '/' },
            { icon: 'search', text: 'Find Positions', link: '/positions' },
          ],
        },
        {
          title: 'Applications',
          buttons: [
            { icon: 'file', text: 'My Applications', link: '/applications' },
            { icon: 'bookmark', text: 'Saved Positions', link: '/saved' },
          ],
        },
      ],
      PROFESSOR: [
        {
          title: 'Manage',
          buttons: [
            { icon: 'home', text: 'Home', link: '/' },
            { icon: 'folder', text: 'My Positions', link: '/my-positions' },
            { icon: 'plus', text: 'Create Position', link: '/job-creation' },
          ],
        },
        {
          title: 'Applications',
          buttons: [{ icon: 'file-contract', text: 'Review Applications', link: '/review' }],
        },
        {
          title: 'Research Group',
          buttons: [
            { icon: 'microscope', text: 'Your Group', link: '/group' },
            { icon: 'people-roof', text: 'Your Members', link: '/members' },
          ],
        },
      ],
      ADMIN: [
        {
          title: 'Dashboard',
          buttons: [
            { icon: 'home', text: 'Home', link: '/' },
            { icon: 'chart-line', text: 'Analytics', link: '/analytics' },
          ],
        },
        {
          title: 'Content',
          buttons: [
            { icon: 'folder', text: 'All Positions', link: '/all-positions' },
            { icon: 'microscope', text: 'Research Groups', link: '/research-groups' },
          ],
        },
        {
          title: 'Users',
          buttons: [
            { icon: 'users', text: 'Manage Users', link: '/manage-users' },
            { icon: 'file', text: 'Applications', link: '/applications' },
          ],
        },
        {
          title: 'System',
          buttons: [{ icon: 'wrench', text: 'System Settings', link: '/settings' }],
        },
      ],
    };
    const authorities = this.accountService.user()?.authorities;
    return authorities?.map((authority: UserShortDTO.RolesEnum) => categoryConfig[authority]).flat();
  }

  isActive(link: string): boolean {
    return this.router.url === link;
  }
}

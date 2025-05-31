import { Component } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PanelModule } from 'primeng/panel';

import { SidebarButtonComponent } from '../../atoms/sidebar-button/sidebar-button.component';

@Component({
  selector: 'jhi-sidebar',
  imports: [PanelModule, SidebarButtonComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  constructor(private accountService: AccountService) {}

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
            { icon: 'home', text: 'Home', link: '/dashboard' },
            { icon: 'folder', text: 'My Positions', link: '/my-positions' },
            { icon: 'plus', text: 'Create Position', link: '/create-position' },
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
    console.log(authorities?.map((authority: UserShortDTO.RolesEnum) => categoryConfig[authority]).flat());
    return authorities?.map((authority: UserShortDTO.RolesEnum) => categoryConfig[authority]).flat();
  }
}

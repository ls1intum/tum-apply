import { Component, input } from '@angular/core';
import { UserShortDTO } from 'app/generated/model/userShortDTO';

@Component({
  selector: 'jhi-sidebar',
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  role = input<UserShortDTO.RolesEnum | undefined>(undefined);

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
          buttons: [{ icon: 'file', text: 'Review Applications', link: '/review' }],
        },
        {
          title: 'Research Group',
          buttons: [
            { icon: 'users', text: 'Your Group', link: '/group' },
            { icon: 'user-friends', text: 'Your Members', link: '/members' },
          ],
        },
      ],
      ADMIN: [
        {
          title: 'Dashboard',
          buttons: [
            { icon: 'home', text: 'Home', link: '/dashboard' },
            { icon: 'chart-bar', text: 'Analytics', link: '/analytics' },
          ],
        },
        {
          title: 'Content',
          buttons: [
            { icon: 'folder', text: 'All Positions', link: '/all-positions' },
            { icon: 'users', text: 'Research Groups', link: '/research-groups' },
          ],
        },
        {
          title: 'Users',
          buttons: [
            { icon: 'user-cog', text: 'Manage Users', link: '/manage-users' },
            { icon: 'file', text: 'Applications', link: '/applications' },
          ],
        },
        {
          title: 'System',
          buttons: [{ icon: 'cogs', text: 'System Settings', link: '/settings' }],
        },
      ],
    };
    const role = this.role();
    return role && categoryConfig[role];
  }
}

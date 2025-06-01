import { Component } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PanelModule } from 'primeng/panel';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarButtonComponent } from '../../atoms/sidebar-button/sidebar-button.component';

@Component({
  selector: 'jhi-sidebar',
  imports: [PanelModule, SidebarButtonComponent, TranslateModule],
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
          title: 'sidebar.dashboard.dashboard',
          buttons: [
            { icon: 'home', text: 'sidebar.dashboard.home', link: '/' },
            { icon: 'search', text: 'sidebar.dashboard.findpositions', link: '/positions' },
          ],
        },
        {
          title: 'sidebar.applications.applications',
          buttons: [
            { icon: 'file', text: 'sidebar.applications.myapplications', link: '/applications' },
            { icon: 'bookmark', text: 'sidebar.applications.savedpositions', link: '/saved' },
          ],
        },
      ],
      PROFESSOR: [
        {
          title: 'sidebar.manage.manage',
          buttons: [
            { icon: 'home', text: 'sidebar.manage.home', link: '/' },
            { icon: 'folder', text: 'sidebar.manage.mypositions', link: '/my-positions' },
            { icon: 'plus', text: 'sidebar.manage.createposition', link: '/job-creation' },
          ],
        },
        {
          title: 'sidebar.applications.applications',
          buttons: [{ icon: 'file-contract', text: 'sidebar.applications.reviewapplications', link: '/review' }],
        },
        {
          title: 'sidebar.researchgroup.researchgroup',
          buttons: [
            { icon: 'microscope', text: 'sidebar.researchgroup.yourgroup', link: '/group' },
            { icon: 'people-roof', text: 'sidebar.researchgroup.yourmembers', link: '/members' },
          ],
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
          buttons: [{ icon: 'wrench', text: 'sidebar.system.systemsettings', link: '/settings' }],
        },
      ],
    };
    const authorities = this.accountService.user()?.authorities;
    return authorities?.map((authority: string) => categoryConfig[authority as UserShortDTO.RolesEnum]).flat();
  }

  isActive(link: string): boolean {
    return this.router.url === link;
  }
}

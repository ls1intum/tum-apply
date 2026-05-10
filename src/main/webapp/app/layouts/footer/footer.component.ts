import { Component, Signal, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { VERSION } from 'app/app.constants';

import TranslateDirective from '../../shared/language/translate.directive';
import { ProfileService } from '../profiles/profile.service';
import { GitInfo, ProfileInfo } from '../profiles/profile-info.model';

const GITHUB_COMMIT_URL = 'https://github.com/ls1intum/tum-apply/commit/';

@Component({
  selector: 'jhi-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  imports: [CommonModule, DatePipe, TranslateDirective],
  encapsulation: ViewEncapsulation.None,
})
export default class FooterComponent {
  version: string;

  protected profileInfo: Signal<ProfileInfo | undefined>;

  private router = inject(Router);
  private profileService = inject(ProfileService);

  constructor() {
    this.version = VERSION;
    this.profileInfo = toSignal(this.profileService.getProfileInfo());
  }

  navigateToImprint(): void {
    void this.router.navigate(['/imprint']);
  }

  navigateToPrivacy(): void {
    void this.router.navigate(['/privacy']);
  }

  navigateToAboutUs(): void {
    void this.router.navigate(['/about-us']);
  }

  protected get gitInfo(): GitInfo | undefined {
    return this.profileInfo()?.gitInfo;
  }

  protected get showGitInfo(): boolean {
    const info = this.profileInfo();
    return info?.ribbonEnv != null && info.gitInfo != null;
  }

  protected commitUrl(sha: string): string {
    return `${GITHUB_COMMIT_URL}${sha}`;
  }
}

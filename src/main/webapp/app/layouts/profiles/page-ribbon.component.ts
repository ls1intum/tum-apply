import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { TranslateDirective } from 'app/shared/language';

import { ProfileService } from './profile.service';

@Component({
  selector: 'jhi-page-ribbon',
  imports: [AsyncPipe, TranslateDirective],
  template: `
    @if (ribbonEnv$ | async; as ribbonEnv) {
      <div class="ribbon">
        <a href="" [jhiTranslate]="'global.ribbon.' + (ribbonEnv ?? '')">{{
          {
            dev: 'Development',
            'test-server': 'Test Server',
          }[ribbonEnv ?? '']
        }}</a>
      </div>
    }
  `,
  styleUrl: './page-ribbon.component.scss',
})
export default class PageRibbonComponent implements OnInit {
  ribbonEnv$?: Observable<string | undefined>;

  private readonly profileService = inject(ProfileService);

  ngOnInit(): void {
    this.ribbonEnv$ = this.profileService.getProfileInfo().pipe(map(profileInfo => profileInfo.ribbonEnv));
  }
}

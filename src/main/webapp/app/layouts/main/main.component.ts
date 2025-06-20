import { Component, Renderer2, RendererFactory2, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';
import { AccountService } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import { SidebarComponent } from 'app/shared/components/organisms/sidebar/sidebar.component';

import FooterComponent from '../footer/footer.component';
import PageRibbonComponent from '../profiles/page-ribbon.component';
import { HeaderComponent } from '../../shared/components/organisms/header/header.component';

@Component({
  selector: 'jhi-main',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  providers: [AppPageTitleStrategy],
  imports: [HeaderComponent, RouterOutlet, SidebarComponent, FooterComponent, PageRibbonComponent],
})
export default class MainComponent {
  readonly accountService = inject(AccountService);
  loggedIn = computed(() => {
    return this.accountService.signedIn();
  });
  currentUrl = signal(inject(Router).url);
  private readonly router = inject(Router);
  private readonly renderer: Renderer2;
  private readonly appPageTitleStrategy = inject(AppPageTitleStrategy);

  private readonly translateService = inject(TranslateService);
  private readonly rootRenderer = inject(RendererFactory2);

  constructor() {
    this.renderer = this.rootRenderer.createRenderer(document.querySelector('html'), null);
    this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
      this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
      dayjs.locale(langChangeEvent.lang);
      this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
    });
    effect(() => {
      void this.initApp();
    });
  }

  private async initApp(): Promise<void> {
    const currentUrl = this.router.url;
    const isPublicRoute = currentUrl === '/' || currentUrl.startsWith('/login') || currentUrl.startsWith('/register');

    if (!isPublicRoute) {
      if (!this.accountService.loaded()) {
        console.warn('User not loaded, redirecting to login.');

        await this.router.navigate(['/login'], {
          queryParams: { redirect: currentUrl },
        });
        return;
      }
    }

    this.router.events.subscribe(() => {
      this.currentUrl.set(this.router.url);
    });
  }
}

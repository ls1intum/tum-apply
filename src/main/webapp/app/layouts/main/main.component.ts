import { Component, Renderer2, RendererFactory2, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';
import { AccountService } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import { keycloakService } from 'app/core/auth/keycloak.service';
import { firstValueFrom } from 'rxjs';

import FooterComponent from '../footer/footer.component';
import PageRibbonComponent from '../profiles/page-ribbon.component';

@Component({
  selector: 'jhi-main',
  templateUrl: './main.component.html',
  providers: [AppPageTitleStrategy],
  imports: [RouterOutlet, FooterComponent, PageRibbonComponent],
})
export default class MainComponent {
  currentUrl = signal(inject(Router).url);
  showLayout = computed(() => {
    return !(this.currentUrl().startsWith('/login') || this.currentUrl().startsWith('/register'));
  });
  private readonly router = inject(Router);
  private readonly renderer: Renderer2;
  private readonly appPageTitleStrategy = inject(AppPageTitleStrategy);
  private readonly accountService = inject(AccountService);
  private readonly translateService = inject(TranslateService);
  private readonly rootRenderer = inject(RendererFactory2);

  constructor() {
    this.renderer = this.rootRenderer.createRenderer(document.querySelector('html'), null);

    effect(() => {
      this.initApp();
    });
  }

  private async initApp(): Promise<void> {
    await keycloakService.init();

    const currentUrl = this.router.url;
    const isPublicRoute = currentUrl.startsWith('/login') || currentUrl.startsWith('/register');

    if (!isPublicRoute) {
      await firstValueFrom(this.accountService.identity());
    }

    this.router.events.subscribe(() => {
      this.currentUrl.set(this.router.url);
    });

    this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
      this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
      dayjs.locale(langChangeEvent.lang);
      this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
    });
  }
}

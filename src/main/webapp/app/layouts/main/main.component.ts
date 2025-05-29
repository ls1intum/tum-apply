import { Component, Renderer2, RendererFactory2, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';
import { AccountService } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import { keycloakService } from 'app/core/auth/keycloak.service';

import FooterComponent from '../footer/footer.component';
import PageRibbonComponent from '../profiles/page-ribbon.component';
import { HeaderComponent } from '../../shared/components/organisms/header/header.component';

@Component({
  selector: 'jhi-main',
  templateUrl: './main.component.html',
  providers: [AppPageTitleStrategy],
  imports: [HeaderComponent, RouterOutlet, FooterComponent, PageRibbonComponent],
})
export default class MainComponent {
  showLayout = true;
  private readonly renderer: Renderer2;
  private readonly router = inject(Router);
  private currentUrl = signal(this.router.url);
  private readonly appPageTitleStrategy = inject(AppPageTitleStrategy);
  private readonly accountService = inject(AccountService);
  private readonly translateService = inject(TranslateService);
  private readonly rootRenderer = inject(RendererFactory2);

  constructor() {
    this.renderer = this.rootRenderer.createRenderer(document.querySelector('html'), null);

    const isPublicRoute = computed(() => {
      const url = this.currentUrl();
      return url.startsWith('/login') || url.startsWith('/register');
    });

    effect(() => {
      if (!isPublicRoute()) {
        toSignal(this.accountService.identity())();
      }
    });

    this.router.events.subscribe(() => {
      this.currentUrl.set(this.router.url);
      this.showLayout = !isPublicRoute();
    });

    keycloakService.init().then(() => {
      this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
        this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
        dayjs.locale(langChangeEvent.lang);
        this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
      });
    });
  }
}

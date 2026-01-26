import { Component, Renderer2, RendererFactory2, afterNextRender, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';
import { AccountService } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import { LocalStorageService } from 'app/service/localStorage.service';
import { SidebarComponent } from 'app/shared/components/organisms/sidebar/sidebar.component';
import { HeaderComponent } from 'app/shared/components/organisms/header/header.component';
import { OnboardingOrchestratorService } from 'app/service/onboarding-orchestrator.service';

import FooterComponent from '../footer/footer.component';
import PageRibbonComponent from '../profiles/page-ribbon.component';

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
  readonly localStorageService = inject(LocalStorageService);
  readonly isSidebarCollapsed = this.localStorageService.sidebarCollapsed;
  private readonly router = inject(Router);
  private readonly renderer: Renderer2;
  private readonly appPageTitleStrategy = inject(AppPageTitleStrategy);
  private readonly translateService = inject(TranslateService);
  private readonly rootRenderer = inject(RendererFactory2);
  private readonly onboardingOrchestratorService = inject(OnboardingOrchestratorService);

  constructor() {
    this.renderer = this.rootRenderer.createRenderer(document.querySelector('html'), null);
    this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
      this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
      dayjs.locale(langChangeEvent.lang);
      this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
    });
    afterNextRender(() => this.onboardingOrchestratorService.hookToAuth(this.loggedIn));
  }

  onActivate(): void {
    const container = document.getElementById('scrollContainer');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  toggleSidebar(): void {
    this.localStorageService.toggle();
  }
}

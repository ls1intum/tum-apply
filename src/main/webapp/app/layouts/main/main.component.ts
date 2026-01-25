import { Component, ElementRef, Renderer2, RendererFactory2, afterNextRender, computed, inject, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';
import { AccountService } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import { LocalStorageService } from 'app/service/localStorage.service';
import { SidebarComponent } from 'app/shared/components/organisms/sidebar/sidebar.component';
import { filter } from 'rxjs/operators';
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
  private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');

  constructor() {
    this.renderer = this.rootRenderer.createRenderer(document.querySelector('html'), null);
    this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
      this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
      dayjs.locale(langChangeEvent.lang);
      this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
    });

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      // Small timeout to ensure the DOM has updated
      setTimeout(() => {
        const container = this.scrollContainer(); // Access it like a signal
        if (container) {
          container.nativeElement.scrollTo({ top: 0, behavior: 'instant' });
        }
      }, 0);
    });

    afterNextRender(() => this.onboardingOrchestratorService.hookToAuth(this.loggedIn));
  }

  toggleSidebar(): void {
    this.localStorageService.toggle();
  }
}

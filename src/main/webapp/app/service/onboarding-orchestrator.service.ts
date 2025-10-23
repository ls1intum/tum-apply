import { Injectable, Injector, Signal, effect, inject } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { filter, map, startWith, switchMap, take } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';

import { OnboardingDialog } from '../shared/components/molecules/onboarding-dialog/onboarding-dialog';
import { AccountService } from '../core/auth/account.service';
import { ProfOnboardingResourceApiService } from '../generated/api/profOnboardingResourceApi.service';
import { ProfOnboardingDTO } from '../generated/model/profOnboardingDTO';

/**
 * Orchestrates the professor onboarding dialog on the client.
 *
 * Usage: call `hookToAuth(accountService.user)` once from MainComponent after bootstrap.
 * When the user transitions to an authenticated state, this service will
 * check with the server and open the onboarding dialog if necessary.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingOrchestratorService {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(DialogService);
  private readonly profOnboardingResourceService = inject(ProfOnboardingResourceApiService);

  // Prevents opening multiple dialogs concurrently.
  private opened = false;

  private readonly checkTrigger$ = new Subject<void>();
  private readonly checkResult = toSignal<ProfOnboardingDTO | undefined>(
    this.checkTrigger$.pipe(switchMap(() => this.profOnboardingResourceService.check().pipe(take(1)))),
    { initialValue: undefined },
  );

  private readonly currentUrl = toSignal<string | undefined>(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { injector: this.injector, initialValue: undefined },
  );

  hookToAuth(loggedIn: Signal<boolean>): void {
    effect(
      () => {
        const isLoggedIn = loggedIn();
        const url = this.currentUrl();
        const onProfessorPage = typeof url === 'string' && url.startsWith('/professor');
        const isApplicant = this.accountService.hasAnyAuthority(['APPLICANT']);

        if (!isLoggedIn || this.opened || !isApplicant || !onProfessorPage) {
          return;
        }
        this.checkTrigger$.next();
      },
      { injector: this.injector },
    );

    effect(
      () => {
        const dto = this.checkResult();
        if (this.opened || dto?.show !== true) {
          return;
        }
        this.opened = true;

        this.dialog.open(OnboardingDialog, {
          header: this.translate.instant('onboarding.title'),
          modal: true,
          closable: true,
          width: '80vw',
        });
      },
      { injector: this.injector },
    );
  }
}

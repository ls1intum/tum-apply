import { Injectable, Injector, Signal, effect, inject } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { OnboardingDialog } from '../shared/components/molecules/onboarding-dialog/onboarding-dialog';
import { ProfOnboardingDTO, ProfOnboardingResourceService } from '../generated';

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
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(DialogService);
  private readonly profOnboardingResourceService = inject(ProfOnboardingResourceService);

  /** Prevents opening multiple dialogs concurrently. */
  private opened = false;

  private readonly checkTrigger$ = new Subject<void>();

  private readonly checkResult = toSignal<ProfOnboardingDTO | null>(
    this.checkTrigger$.pipe(switchMap(() => this.profOnboardingResourceService.check().pipe(take(1)))),
    { initialValue: null },
  );

  hookToAuth(loggedIn: Signal<boolean>): void {
    effect(
      () => {
        const isLoggedIn = loggedIn();
        if (!isLoggedIn || this.opened) {
          return;
        }
        this.checkTrigger$.next();
      },
      { injector: this.injector },
    );

    effect(
      () => {
        const dto = this.checkResult();
        if (dto === null || this.opened || dto.show !== true) {
          return;
        }
        this.opened = true;

        this.dialog.open(OnboardingDialog, {
          header: this.translate.instant('onboarding.dialog.title'),
          modal: true,
          closable: false,
        });
      },
      { injector: this.injector },
    );
  }
}

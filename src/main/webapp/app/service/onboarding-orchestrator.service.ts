import { Injectable, Signal, effect, inject } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { take } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

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
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(DialogService);
  private readonly profOnboardingResourceService = inject(ProfOnboardingResourceService);

  /** Prevents opening multiple dialogs concurrently. */
  private opened = false;

  hookToAuth(loggedIn: Signal<boolean>): void {
    effect(() => {
      const isLoggedIn = loggedIn();
      if (!isLoggedIn || this.opened) {
        return;
      }

      const checkSignal = toSignal<ProfOnboardingDTO | null>(this.profOnboardingResourceService.check().pipe(take(1)), {
        initialValue: null,
      });

      effect(() => {
        const dto = checkSignal();
        if (dto === null || this.opened || dto.show !== true) {
          return;
        }
        this.opened = true;

        const ref = this.dialog.open(OnboardingDialog, {
          header: this.translate.instant('onboarding.dialog.title'),
          modal: true,
          closable: false,
        });

        const closed = toSignal<boolean | null>(ref.onClose.pipe(take(1)), { initialValue: null });
        effect(() => {
          if (closed() === true) {
            this.opened = false;
          }
        });
      });
    });
  }
}

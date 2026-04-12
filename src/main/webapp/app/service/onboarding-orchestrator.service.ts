import { Injectable, Injector, Signal, effect, inject } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { ONBOARDING_FORM_DIALOG_CONFIG } from 'app/shared/constants/onboarding-dialog.constants';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { checkResource } from '../generated/api/prof-onboarding-resource-api';

import { OnboardingDialog } from '../shared/components/molecules/onboarding-dialog/onboarding-dialog';
import { AccountService } from '../core/auth/account.service';

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

  // Prevents opening multiple dialogs concurrently.
  private opened = false;

  private readonly onboardingCheckResource = checkResource();

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
        const isApplicant = this.accountService.hasAnyAuthority([UserShortDTORolesEnum.Applicant]);

        if (!isLoggedIn || this.opened || !isApplicant || !onProfessorPage) {
          return;
        }
        this.onboardingCheckResource.reload();
      },
      { injector: this.injector },
    );

    effect(
      () => {
        const dto = this.onboardingCheckResource.value();
        if (this.opened || dto?.show !== true) {
          return;
        }
        this.opened = true;

        this.dialog.open(OnboardingDialog, {
          ...ONBOARDING_FORM_DIALOG_CONFIG,
          header: this.translate.instant('onboarding.title'),
        });
      },
      { injector: this.injector },
    );
  }
}

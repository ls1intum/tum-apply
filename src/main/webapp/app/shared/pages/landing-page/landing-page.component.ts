import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from 'app/core/auth/account.service';

import { HeroSectionComponent } from './hero-section/hero-section.component';
import { ApplicationStepsSectionComponent } from './application-steps-section/application-steps-section.component';
import { DoctoralJourneySectionComponent } from './doctoral-journey-section/doctoral-journey-section.component';
import { InformationSectionComponent } from './information-section/information-section.component';
import { FaqSectionComponent } from './faq-section/faq-section.component';

@Component({
  selector: 'jhi-landing-page',
  imports: [
    HeroSectionComponent,
    ApplicationStepsSectionComponent,
    DoctoralJourneySectionComponent,
    InformationSectionComponent,
    FaqSectionComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  router = inject(Router);
  accountService = inject(AccountService);

  private redirectEffect = effect(() => {
    const user = this.accountService.user();
    if (user && this.accountService.hasAnyAuthority(['PROFESSOR'])) {
      void this.router.navigate(['/professor']);
    }
  });
}

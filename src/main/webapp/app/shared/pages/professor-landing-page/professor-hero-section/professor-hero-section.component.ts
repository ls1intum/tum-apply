import { Component, inject } from '@angular/core';
import { Carousel } from 'primeng/carousel';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AccountService } from 'app/core/auth/account.service';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';

import { ButtonComponent } from '../../../components/atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-professor-hero-section',
  standalone: true,
  imports: [ButtonComponent, Carousel, TranslateModule, TranslateDirective],
  templateUrl: './professor-hero-section.component.html',
  styleUrl: './professor-hero-section.component.scss',
})
export class ProfessorHeroSectionComponent {
  imagesWithBackgroundClass = [
    { image: 'professor-landing-page-hero-section-1', backgroundClass: 'hero-background-professor-landing-page-hero-section-1' },
    { image: 'professor-landing-page-hero-section-2', backgroundClass: 'hero-background-professor-landing-page-hero-section-2' },
    { image: 'professor-landing-page-hero-section-3', backgroundClass: 'hero-background-professor-landing-page-hero-section-3' },
  ];

  private router = inject(Router);
  private accountService = inject(AccountService);
  private authFacadeService = inject(AuthFacadeService);

  navigateToGetStarted(): void {
    if (this.accountService.signedIn() && this.accountService.hasAnyAuthority(['PROFESSOR'])) {
      // User is logged in as a professor, navigate to My Positions page
      this.router.navigate(['/my-positions']);
    } else {
      // User is not logged in or is not a professor, trigger TUM SSO login
      void this.authFacadeService.loginWithTUM(this.router.url);
    }
  }
}

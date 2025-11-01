import { Component, inject } from '@angular/core';
import { Carousel } from 'primeng/carousel';
import { TranslateModule } from '@ngx-translate/core';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { Router } from '@angular/router';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import { AccountService } from 'app/core/auth/account.service';

@Component({
  selector: 'jhi-professor-hero-section',
  imports: [ButtonComponent, Carousel, TranslateModule, TranslateDirective],
  templateUrl: './professor-hero-section.component.html',
  styleUrl: './professor-hero-section.component.scss',
})
export class ProfessorHeroSectionComponent {
  imagesWithBackgroundClass = [
    {
      image: 'professor-landing-page-hero-section-1',
      backgroundClass: 'hero-background-professor-landing-page-hero-section-1',
    },
    {
      image: 'professor-landing-page-hero-section-2',
      backgroundClass: 'hero-background-professor-landing-page-hero-section-2',
    },
    {
      image: 'professor-landing-page-hero-section-3',
      backgroundClass: 'hero-background-professor-landing-page-hero-section-3',
    },
  ];

  private authFacadeService = inject(AuthFacadeService);
  private accountService = inject(AccountService);
  private router = inject(Router);

  async navigateToGetStarted(): Promise<void> {
    if (this.accountService.signedIn()) {
      await this.router.navigate(['/my-positions']);
    } else {
      await this.authFacadeService.loginWithProvider(IdpProvider.TUM, '/my-positions');
    }
  }
}

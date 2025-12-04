import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ProfessorHeroSectionComponent } from 'app/shared/pages/professor-landing-page/professor-hero-section/professor-hero-section.component';
import { provideTranslateMock } from 'util/translate.mock';
import { AuthFacadeServiceMock, createAuthFacadeServiceMock, provideAuthFacadeServiceMock } from 'util/auth-facade.service.mock';
import { AccountServiceMock, createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { createRouterMock, provideRouterMock, RouterMock } from 'util/router.mock';
import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';

describe('ProfessorHeroSectionComponent', () => {
  let fixture: ComponentFixture<ProfessorHeroSectionComponent>;
  let component: ProfessorHeroSectionComponent;
  let nativeElement: HTMLElement;
  let authFacadeServiceMock: AuthFacadeServiceMock;
  let accountServiceMock: AccountServiceMock;
  let routerMock: RouterMock;

  beforeEach(async () => {
    authFacadeServiceMock = createAuthFacadeServiceMock();
    accountServiceMock = createAccountServiceMock(false);
    routerMock = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [ProfessorHeroSectionComponent],
      providers: [
        provideTranslateMock(),
        provideAuthFacadeServiceMock(authFacadeServiceMock),
        provideAccountServiceMock(accountServiceMock),
        provideRouterMock(routerMock),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorHeroSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Image Carousel', () => {
    it('should define three images with background classes', () => {
      expect(component.imagesWithBackgroundClass).toHaveLength(3);
    });

    it('should render carousel component', () => {
      const carousel = nativeElement.querySelector('p-carousel');
      expect(carousel).not.toBeNull();
    });
  });

  describe('Navigation', () => {
    describe('when user is not signed in', () => {
      beforeEach(() => {
        accountServiceMock = createAccountServiceMock(false);
      });

      it('should call loginWithProvider', async () => {
        await component.navigateToGetStarted();

        expect(authFacadeServiceMock.loginWithProvider).toHaveBeenCalledWith(IdpProvider.TUM, '/my-positions');
        expect(routerMock.navigate).not.toHaveBeenCalled();
      });
    });

    describe('when user is signed in', () => {
      beforeEach(() => {
        accountServiceMock = createAccountServiceMock(true);
        // Recreate component with signed-in user
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          imports: [ProfessorHeroSectionComponent],
          providers: [
            provideTranslateMock(),
            provideAuthFacadeServiceMock(authFacadeServiceMock),
            provideAccountServiceMock(accountServiceMock),
            provideRouterMock(routerMock),
          ],
        });
        fixture = TestBed.createComponent(ProfessorHeroSectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });

      it('should navigate to my-positions', async () => {
        await component.navigateToGetStarted();

        expect(routerMock.navigate).toHaveBeenCalledWith(['/my-positions']);
        expect(authFacadeServiceMock.loginWithProvider).not.toHaveBeenCalled();
      });
    });
  });

  describe('Template Rendering', () => {
    it('should render get started button', () => {
      const button = nativeElement.querySelector('jhi-button');
      expect(button).not.toBeNull();
    });
  });
});

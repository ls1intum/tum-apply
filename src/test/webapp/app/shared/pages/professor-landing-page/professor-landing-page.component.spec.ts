import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ProfessorLandingPageComponent } from 'app/shared/pages/professor-landing-page/professor-landing-page.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { createAuthFacadeServiceMock, provideAuthFacadeServiceMock } from 'util/auth-facade.service.mock';
import { createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { createRouterMock, provideRouterMock } from 'util/router.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('ProfessorLandingPageComponent', () => {
  let fixture: ComponentFixture<ProfessorLandingPageComponent>;
  let component: ProfessorLandingPageComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    const authFacadeServiceMock = createAuthFacadeServiceMock();
    const accountServiceMock = createAccountServiceMock();
    const routerMock = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [ProfessorLandingPageComponent],
      providers: [
        provideTranslateMock(),
        provideHttpClientTesting(),
        provideAuthFacadeServiceMock(authFacadeServiceMock),
        provideAccountServiceMock(accountServiceMock),
        provideRouterMock(routerMock),
        provideFontAwesomeTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorLandingPageComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Section Rendering', () => {
    it('should render the professor hero section', () => {
      expect(nativeElement.querySelector('jhi-professor-hero-section')).not.toBeNull();
    });

    it('should render the professor benefits section', () => {
      expect(nativeElement.querySelector('jhi-professor-benefits-section')).not.toBeNull();
    });

    it('should render the professor workflow section', () => {
      expect(nativeElement.querySelector('jhi-professor-workflow-section')).not.toBeNull();
    });

    it('should render the professor information section', () => {
      expect(nativeElement.querySelector('jhi-professor-information-section')).not.toBeNull();
    });

    it('should render the professor FAQ section', () => {
      expect(nativeElement.querySelector('jhi-professor-faq-section')).not.toBeNull();
    });
  });
});

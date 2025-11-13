import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { LandingPageComponent } from 'app/shared/pages/landing-page/landing-page.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { createRouterMock, provideRouterMock } from 'util/router.mock';

@Component({ selector: 'jhi-hero-section', standalone: true, template: '' })
class StubHeroSection {
  private readonly _dummy = true;
}

@Component({ selector: 'jhi-doctoral-journey-section', standalone: true, template: '' })
class StubDoctoralJourneySection {
  private readonly _dummy = true;
}

@Component({ selector: 'jhi-application-steps-section', standalone: true, template: '' })
class StubApplicationStepsSection {
  private readonly _dummy = true;
}

@Component({ selector: 'jhi-information-section', standalone: true, template: '' })
class StubInformationSection {
  private readonly _dummy = true;
}

@Component({ selector: 'jhi-faq-section', standalone: true, template: '' })
class StubFaqSection {
  private readonly _dummy = true;
}

describe('LandingPageComponent', () => {
  let fixture: ComponentFixture<LandingPageComponent>;
  let component: LandingPageComponent;
  let nativeElement: HTMLElement;
  let routerMock: ReturnType<typeof createRouterMock>;

  beforeEach(async () => {
    routerMock = createRouterMock();
    const accountServiceMock = createAccountServiceMock();
    accountServiceMock.hasAnyAuthority = (roles: string[]) => roles.includes('PROFESSOR');

    await TestBed.configureTestingModule({
      imports: [
        LandingPageComponent,
        StubHeroSection,
        StubDoctoralJourneySection,
        StubApplicationStepsSection,
        StubInformationSection,
        StubFaqSection,
      ],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideNoopAnimations(),
        provideHttpClientTesting(),
        provideAccountServiceMock(),
        provideRouterMock(routerMock),
        provideAccountServiceMock(accountServiceMock),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect professor user to /professor', () => {
    expect(routerMock.navigate).toHaveBeenCalledWith(['/professor']);
  });

  it('should render all main section components', () => {
    expect(nativeElement.querySelector('jhi-hero-section')).not.toBeNull();
    expect(nativeElement.querySelector('jhi-doctoral-journey-section')).not.toBeNull();
    expect(nativeElement.querySelector('jhi-application-steps-section')).not.toBeNull();
    expect(nativeElement.querySelector('jhi-information-section')).not.toBeNull();
    expect(nativeElement.querySelector('jhi-faq-section')).not.toBeNull();
  });
});

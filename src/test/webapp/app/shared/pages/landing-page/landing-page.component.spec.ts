import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';

import { LandingPageComponent } from 'app/shared/pages/landing-page/landing-page.component';

@Component({ selector: 'jhi-hero-section', standalone: true, template: '' })
class StubHeroSection {}

@Component({ selector: 'jhi-application-steps-section', standalone: true, template: '' })
class StubApplicationStepsSection {}

@Component({ selector: 'jhi-doctoral-journey-section', standalone: true, template: '' })
class StubDoctoralJourneySection {}

@Component({ selector: 'jhi-information-section', standalone: true, template: '' })
class StubInformationSection {}

@Component({ selector: 'jhi-faq-section', standalone: true, template: '' })
class StubFaqSection {}

describe('LandingPageComponent', () => {
  let fixture: ComponentFixture<LandingPageComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LandingPageComponent,
        StubHeroSection,
        StubApplicationStepsSection,
        StubDoctoralJourneySection,
        StubInformationSection,
        StubFaqSection,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render all landing page sections', () => {
    expect(nativeElement.querySelector('jhi-hero-section')).not.toBeNull();
    expect(nativeElement.querySelector('jhi-doctoral-journey-section')).not.toBeNull();
    expect(nativeElement.querySelector('jhi-application-steps-section')).not.toBeNull();
    expect(nativeElement.querySelector('jhi-information-section')).not.toBeNull();
    expect(nativeElement.querySelector('jhi-faq-section')).not.toBeNull();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '@angular/router';

import { HeroSectionComponent } from 'app/shared/pages/landing-page/hero-section/hero-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';

describe('HeroSectionComponent', () => {
  let fixture: ComponentFixture<HeroSectionComponent>;
  let component: HeroSectionComponent;
  let nativeElement: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    const routerMock = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HeroSectionComponent],
      providers: [provideTranslateMock(), { provide: Router, useValue: routerMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct amount of slides', () => {
    const slides = component.imagesWithBackgroundClass;
    expect(slides.length).toBe(3);
  });

  it('should render headline and subline translate keys', () => {
    const headline = nativeElement.querySelector('h1.title');
    const subline = nativeElement.querySelector('p.subtitle');
    expect(headline?.getAttribute('jhiTranslate')).toBe('landingPage.hero.headline');
    expect(subline?.getAttribute('jhiTranslate')).toBe('landingPage.hero.subline');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CommonModule } from '@angular/common';

import { InformationSectionComponent } from 'app/shared/pages/landing-page/information-section/information-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';

describe('InformationSectionComponent', () => {
  let fixture: ComponentFixture<InformationSectionComponent>;
  let component: InformationSectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, InformationSectionComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the headline with correct translate key', () => {
    const headline = nativeElement.querySelector('h2.title');
    expect(headline).not.toBeNull();
    expect(headline?.getAttribute('jhiTranslate')).toBe('landingPage.informationSection.headline');
  });

  it('should define correct data for first card in the cards array', () => {
    const firstCard = component.cards[0];
    expect(firstCard.imageSrc).toBe('/content/images/landing-page/information-section/excellence.webp');
    expect(firstCard.link).toBe('https://www.tum.de/en/about-tum/university-of-excellence');
    expect(firstCard.text).toBe('landingPage.informationSection.tiles.1');
  });

  it('should render one information card per entry in the cards array', () => {
    const cards = nativeElement.querySelectorAll('jhi-information-card');
    expect(cards.length).toBe(component.cards.length);
  });
});

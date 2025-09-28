import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';

import { InformationSectionComponent } from 'app/shared/pages/landing-page/information-section/information-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';

@Component({
  selector: 'jhi-information-card',
  standalone: true,
  template: '',
})
class StubInformationCardComponent {
  @Input() imageSrc!: string;
  @Input() text!: string;
  @Input() link!: string;
}

describe('InformationSectionComponent', () => {
  let fixture: ComponentFixture<InformationSectionComponent>;
  let component: InformationSectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationSectionComponent, StubInformationCardComponent],
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

  it('should render 6 <jhi-information-card> components', () => {
    const cards = fixture.debugElement.queryAll(By.directive(StubInformationCardComponent));
    expect(cards.length).toBe(6);
  });

  it('should bind correct inputs to the first information card', () => {
    const card = fixture.debugElement.queryAll(By.directive(StubInformationCardComponent))[0].componentInstance;

    expect(card.imageSrc).toBe('/content/images/landing-page/information-section/excellence.webp');
    expect(card.link).toBe('https://www.tum.de/en/about-tum/university-of-excellence');
    expect(card.text).toBe('landingPage.informationSection.tiles.1');
  });
});

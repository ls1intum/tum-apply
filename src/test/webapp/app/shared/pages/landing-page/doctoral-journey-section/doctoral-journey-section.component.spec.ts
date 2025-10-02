import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { DoctoralJourneySectionComponent } from 'app/shared/pages/landing-page/doctoral-journey-section/doctoral-journey-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { ButtonGroupStubComponent } from 'src/test/webapp/util/button-group.stub';

describe('DoctoralJourneySectionComponent', () => {
  let fixture: ComponentFixture<DoctoralJourneySectionComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctoralJourneySectionComponent, ButtonGroupStubComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctoralJourneySectionComponent);
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render image with correct path', () => {
    const img = nativeElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe(
      '/content/images/landing-page/doctoral-journey-section/landing-page-doctoral-journey.webp',
    );
  });

  it('should render headline with correct translation key', () => {
    const headline = nativeElement.querySelector('h2.title');
    expect(headline?.getAttribute('jhiTranslate')).toBe('landingPage.doctoralJourney.headline');
  });

  it('should render paragraph with correct translation key', () => {
    const paragraph = nativeElement.querySelector('p.text');
    expect(paragraph?.getAttribute('jhiTranslate')).toBe('landingPage.doctoralJourney.text');
  });

  it('should provide correct button group data', () => {
    const data = fixture.componentInstance.buttons();
    expect(data.direction).toBe('horizontal');
    expect(data.buttons.length).toBe(2);

    const [btn1, btn2] = data.buttons;

    expect(btn1.label).toBe('landingPage.doctoralJourney.button1');
    expect(btn1.severity).toBe('secondary');
    expect(btn1.variant).toBe('outlined');
    expect(btn1.isExternalLink).toBe(true);

    expect(btn2.label).toBe('landingPage.doctoralJourney.button2');
    expect(btn2.severity).toBe('primary');
    expect(btn2.isExternalLink).toBe(true);
  });

  it('should open correct URL for first button', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
    fixture.componentInstance.buttons().buttons[0].onClick();
    expect(spy).toHaveBeenCalledWith(
      'https://www.gs.tum.de/en/gs/path-to-a-doctorate/why-do-your-doctorate-at-tum/',
      '_blank',
    );
    spy.mockRestore();
  });

  it('should open correct URL for second button', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
    fixture.componentInstance.buttons().buttons[1].onClick();
    expect(spy).toHaveBeenCalledWith(
      'https://www.gs.tum.de/en/gs/doctorate-at-tum/',
      '_blank',
    );
    spy.mockRestore();
  });
});

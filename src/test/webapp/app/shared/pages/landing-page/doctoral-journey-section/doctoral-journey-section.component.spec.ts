import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

import { DoctoralJourneySectionComponent } from 'app/shared/pages/landing-page/doctoral-journey-section/doctoral-journey-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';

import { Component, Input } from '@angular/core';
import { ButtonGroupData } from 'app/shared/components/molecules/button-group/button-group.component';

@Component({
  selector: 'jhi-button-group',
  standalone: true,
  template: '',
})
class StubButtonGroupComponent {
  @Input() data!: ButtonGroupData;
}

describe('DoctoralJourneySectionComponent', () => {
  let fixture: ComponentFixture<DoctoralJourneySectionComponent>;
  let component: DoctoralJourneySectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctoralJourneySectionComponent, StubButtonGroupComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctoralJourneySectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render image with correct path', () => {
    const img = nativeElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/content/images/landing-page/doctoral-journey-section/landing-page-doctoral-journey.webp');
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
    const data = component.buttons();
    expect(data.direction).toBe('horizontal');
    expect(data.buttons.length).toBe(2);

    const whyDoctorateBtn = data.buttons[0];
    expect(whyDoctorateBtn.label).toBe('landingPage.doctoralJourney.button1');
    expect(whyDoctorateBtn.severity).toBe('secondary');
    expect(whyDoctorateBtn.variant).toBe('outlined');
    expect(whyDoctorateBtn.isExternalLink).toBe(true);

    const doctorateAtTUMBtn = data.buttons[1];
    expect(doctorateAtTUMBtn.label).toBe('landingPage.doctoralJourney.button2');
    expect(doctorateAtTUMBtn.severity).toBe('primary');
    expect(doctorateAtTUMBtn.isExternalLink).toBe(true);
  });

  it('should open correct URL for "Why Do Your Doctorate at TUM" button', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const data = component.buttons();

    const whyDoctorateBtn = data.buttons[0];
    whyDoctorateBtn.onClick();

    expect(spy).toHaveBeenCalledWith(
      'https://www.gs.tum.de/en/gs/path-to-a-doctorate/why-do-your-doctorate-at-tum/',
      '_blank'
    );

    spy.mockRestore();
  });

  it('should open correct URL for "Doctorate at TUM" button', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const data = component.buttons();

    const doctorateAtTUMBtn = data.buttons[1];
    doctorateAtTUMBtn.onClick();

    expect(spy).toHaveBeenCalledWith(
      'https://www.gs.tum.de/en/gs/doctorate-at-tum/',
      '_blank'
    );

    spy.mockRestore();
  });
});

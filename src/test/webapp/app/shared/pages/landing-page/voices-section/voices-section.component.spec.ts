import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, Input } from '@angular/core';

import { VoicesSectionComponent } from 'app/shared/pages/landing-page/voices-section/voices-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';

@Component({
  selector: 'jhi-voice-card',
  standalone: true,
  template: '',
})
class StubVoiceCardComponent {
  @Input() name!: string;
  @Input() field!: string;
  @Input() quote!: string;
  @Input() imageSrc!: string;
}

describe('VoicesSectionComponent', () => {
  let fixture: ComponentFixture<VoicesSectionComponent>;
  let component: VoicesSectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoicesSectionComponent, StubVoiceCardComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(VoicesSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render 5 voice cards', () => {
    const cards = nativeElement.querySelectorAll('jhi-voice-card');
    expect(cards.length).toBe(5);
  });

  it('should render the headline with correct translate key', () => {
    const headline = nativeElement.querySelector('h2.title');
    expect(headline).not.toBeNull();
    expect(headline?.getAttribute('jhiTranslate')).toBe('landingPage.voices.headline');
  });
});

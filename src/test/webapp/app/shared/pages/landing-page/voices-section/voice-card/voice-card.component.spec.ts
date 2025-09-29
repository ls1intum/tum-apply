import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { VoiceCardComponent } from 'app/shared/pages/landing-page/voices-section/voice-card/voice-card/voice-card.component';

describe('VoiceCardComponent', () => {
  let fixture: ComponentFixture<VoiceCardComponent>;
  let component: VoiceCardComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceCardComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
  });

  it('should render all inputs correctly', () => {
    fixture.componentRef.setInput('name', 'Jane Doe');
    fixture.componentRef.setInput('field', 'Artificial Intelligence');
    fixture.componentRef.setInput('quote', 'Doing a PhD at TUM changed my life.');
    fixture.componentRef.setInput('imageSrc', '/assets/jane.webp');
    fixture.detectChanges();

    const imgEl = nativeElement.querySelector('img');
    const nameEl = nativeElement.querySelector('.name');
    const fieldEl = nativeElement.querySelector('.field');
    const quoteEl = nativeElement.querySelector('.quote');

    expect(imgEl?.getAttribute('src')).toBe('/assets/jane.webp');
    expect(imgEl?.getAttribute('alt')).toBe('Jane Doe');
    expect(nameEl?.textContent).toBe('Jane Doe');
    expect(fieldEl?.textContent).toBe('Artificial Intelligence');
    expect(quoteEl?.textContent).toBe('Doing a PhD at TUM changed my life.');
  });
});

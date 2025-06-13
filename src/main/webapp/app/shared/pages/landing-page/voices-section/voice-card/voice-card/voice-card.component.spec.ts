import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceCardComponent } from './voice-card.component';

describe('VoiceCardComponent', () => {
  let component: VoiceCardComponent;
  let fixture: ComponentFixture<VoiceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoicesSectionComponent } from './voices-section.component';

describe('VoicesSectionComponent', () => {
  let component: VoicesSectionComponent;
  let fixture: ComponentFixture<VoicesSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoicesSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoicesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

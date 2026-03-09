import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AiScoreRingComponent } from 'app/shared/components/atoms/ai-score-ring/ai-score-ring.component';

describe('AiScoreRingComponent', () => {
  let fixture: ComponentFixture<AiScoreRingComponent>;
  let component: AiScoreRingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiScoreRingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiScoreRingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should clamps score input to the valid 0..100 range', () => {
    fixture.componentRef.setInput('score', 150);
    fixture.detectChanges();
    expect(component.boundedScore()).toBe(100);

    fixture.componentRef.setInput('score', -12);
    fixture.detectChanges();
    expect(component.boundedScore()).toBe(0);
  });

  it('should map animated score to danger/warning/primary colors', () => {
    component.animatedScore.set(10);
    expect(component.scoreColor()).toBe('var(--p-danger-color)');

    component.animatedScore.set(component.warningThreshold);
    expect(component.scoreColor()).toBe('var(--color-amber-200)');

    component.animatedScore.set(component.warningThreshold + 1);
    expect(component.scoreColor()).toBe('var(--p-primary-color)');
  });

  it('should calculate stroke offset from the animated score', () => {
    component.animatedScore.set(0);
    expect(component.strokeOffset()).toBeCloseTo(component.circumference, 5);

    component.animatedScore.set(100);
    expect(component.strokeOffset()).toBeCloseTo(0, 5);

    component.animatedScore.set(50);
    expect(component.strokeOffset()).toBeCloseTo(component.circumference / 2, 5);
  });
});

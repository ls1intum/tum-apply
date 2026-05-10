import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import { RatingComponent } from 'app/shared/components/atoms/rating/rating.component';

describe('RatingComponent', () => {
  let fixture: ComponentFixture<RatingComponent>;
  let component: RatingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(RatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------- ON SECTION CLICK ----------------
  it('should do nothing when not selectable', () => {
    fixture.componentRef.setInput('selectable', false);
    fixture.detectChanges();

    component.onSectionClick(2);
    expect(component.rating()).toBeUndefined();
  });

  it('should select and toggle off when selectable', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    component.onSectionClick(0); // -2
    expect(component.rating()).toBe(-2);

    // clicking again toggles off
    component.onSectionClick(0);
    expect(component.rating()).toBeUndefined();
  });

  it('should change rating when selecting different value', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    component.onSectionClick(1);
    expect(component.rating()).toBe(-1);

    component.onSectionClick(4);
    expect(component.rating()).toBe(2);
  });

  // ---------------- GET SECTION COLOR ----------------
  it('should return background color when rating is undefined', () => {
    fixture.componentRef.setInput('rating', undefined);
    fixture.detectChanges();

    expect(component.getSectionColor(0)).toBe('var(--p-background-surface-alt)');
  });

  it('should return correct colors for each likert value', () => {
    fixture.componentRef.setInput('rating', -2);
    fixture.detectChanges();
    expect(component.getSectionColor(0)).toBe('var(--color-negative-active)');

    fixture.componentRef.setInput('rating', -1);
    fixture.detectChanges();
    expect(component.getSectionColor(1)).toBe('var(--color-negative-hover)');

    fixture.componentRef.setInput('rating', 0);
    fixture.detectChanges();
    expect(component.getSectionColor(2)).toBe('var(--color-warning-default)');

    fixture.componentRef.setInput('rating', 1);
    fixture.detectChanges();
    expect(component.getSectionColor(3)).toBe('var(--color-positive-hover)');

    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();
    expect(component.getSectionColor(4)).toBe('var(--color-positive-active)');
  });

  it('should fall back to background color when section does not match current rating', () => {
    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();

    expect(component.getSectionColor(0)).toBe('var(--p-background-surface-alt)');
  });

  // ---------------- TOOLTIP TEXTS ----------------
  it('should expose translated tooltip text for every likert value', () => {
    const tooltips = component.tooltipTexts();
    expect(tooltips[0]).toBe('evaluation.ratings.very_bad');
    expect(tooltips[1]).toBe('evaluation.ratings.bad');
    expect(tooltips[2]).toBe('evaluation.ratings.neutral');
    expect(tooltips[3]).toBe('evaluation.ratings.good');
    expect(tooltips[4]).toBe('evaluation.ratings.very_good');
  });

  // ---------------- GET CURSOR ----------------
  it('should return pointer when selectable', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    expect(component.getCursor()).toBe('pointer');
  });

  it('should return default when not selectable', () => {
    fixture.componentRef.setInput('selectable', false);
    fixture.detectChanges();

    expect(component.getCursor()).toBe('default');
  });
});

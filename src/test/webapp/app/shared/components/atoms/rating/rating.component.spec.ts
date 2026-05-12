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

  it.each<[number | undefined, number, string]>([
    [undefined, 0, 'var(--p-background-surface-alt)'],
    [-2, 0, 'var(--color-negative-active)'],
    [-1, 1, 'var(--color-negative-hover)'],
    [0, 2, 'var(--color-warning-default)'],
    [1, 3, 'var(--color-positive-hover)'],
    [2, 4, 'var(--color-positive-active)'],
    [2, 0, 'var(--p-background-surface-alt)'],
  ])('should return %s for rating=%s section=%s', (rating, section, expected) => {
    fixture.componentRef.setInput('rating', rating);
    fixture.detectChanges();
    expect(component.getSectionColor(section)).toBe(expected);
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

  it.each<[boolean, string]>([
    [true, 'pointer'],
    [false, 'default'],
  ])('should return cursor=%s for selectable=%s', (selectable, expected) => {
    fixture.componentRef.setInput('selectable', selectable);
    fixture.detectChanges();
    expect(component.getCursor()).toBe(expected);
  });
});

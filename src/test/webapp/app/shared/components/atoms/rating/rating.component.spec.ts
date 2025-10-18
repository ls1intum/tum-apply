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
  it('does nothing when not selectable', () => {
    fixture.componentRef.setInput('selectable', false);
    fixture.detectChanges();

    component.onSectionClick(2);
    expect(component.rating()).toBeUndefined();
  });

  it('selects and toggles off when selectable', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    component.onSectionClick(0); // -2
    expect(component.rating()).toBe(-2);

    // clicking again toggles off
    component.onSectionClick(0);
    expect(component.rating()).toBeUndefined();
  });

  it('changes rating when selecting different value', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    component.onSectionClick(1);
    expect(component.rating()).toBe(-1);

    component.onSectionClick(4);
    expect(component.rating()).toBe(2);
  });

  // ---------------- GET SECTION COLOR ----------------
  it('returns background color when rating is undefined', () => {
    fixture.componentRef.setInput('rating', undefined);
    fixture.detectChanges();

    expect(component.getSectionColor(0)).toBe('var(--p-background-surface-alt)');
  });

  it('returns correct colors for each likert value', () => {
    fixture.componentRef.setInput('rating', -2);
    fixture.detectChanges();
    expect(component.getSectionColor(0)).toBe('var(--p-danger-active-color)');

    fixture.componentRef.setInput('rating', -1);
    fixture.detectChanges();
    expect(component.getSectionColor(1)).toBe('var(--p-danger-hover-color)');

    fixture.componentRef.setInput('rating', 0);
    fixture.detectChanges();
    expect(component.getSectionColor(2)).toBe('var(--p-warn-color)');

    fixture.componentRef.setInput('rating', 1);
    fixture.detectChanges();
    expect(component.getSectionColor(3)).toBe('var(--p-success-hover-color)');

    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();
    expect(component.getSectionColor(4)).toBe('var(--p-success-active-color)');
  });

  it('falls back to background color when section does not match current rating', () => {
    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();

    expect(component.getSectionColor(0)).toBe('var(--p-background-surface-alt)');
  });

  // ---------------- GET TOOLTIP ----------------
  it('returns expected tooltip key', () => {
    expect(component.getTooltip(0)).toBe('evaluation.ratings.very_bad');
    expect(component.getTooltip(4)).toBe('evaluation.ratings.very_good');
  });

  // ---------------- GET CURSOR ----------------
  it('returns pointer when selectable', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    expect(component.getCursor()).toBe('pointer');
  });

  it('returns default when not selectable', () => {
    fixture.componentRef.setInput('selectable', false);
    fixture.detectChanges();

    expect(component.getCursor()).toBe('default');
  });
});

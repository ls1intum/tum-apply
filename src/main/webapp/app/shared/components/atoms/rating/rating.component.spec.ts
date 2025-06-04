import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { RatingComponent } from './rating.component';

describe('RatingComponent', () => {
  let fixture: ComponentFixture<RatingComponent>;
  let component: RatingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatingComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders a centered marker for rating 0 on a 5 Likert scale', () => {
    fixture.componentRef.setInput('rating', 0);
    fixture.detectChanges();
    const marker = fixture.debugElement.query(By.css('.marker')).nativeElement as HTMLElement;
    expect(marker.style.left).toBe('50%');
    expect(marker.style.width).toBe('19%');
    expect(component.backgroundColor()).toBe('#FFBF0F');
  });

  it('places the marker at the end for the maximum positive rating', () => {
    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();
    const marker = fixture.debugElement.query(By.css('.marker')).nativeElement as HTMLElement;
    expect(marker.style.left).toBe('90%');
    expect(marker.style.width).toBe('19%');
    expect(component.backgroundColor()).toBe('#17723f');
  });

  it('places the marker at the start for the maximum negative rating', () => {
    fixture.componentRef.setInput('rating', -2);
    fixture.detectChanges();
    const marker = fixture.debugElement.query(By.css('.marker')).nativeElement as HTMLElement;
    expect(marker.style.left).toBe('10%');
    expect(marker.style.width).toBe('19%');
    expect(component.backgroundColor()).toBe('#ac0c22');
  });

  it('recalculates values for a Likert 7 scale', () => {
    fixture.componentRef.setInput('likertScale', 7);
    fixture.componentRef.setInput('rating', 3);
    fixture.detectChanges();
    const marker = fixture.debugElement.query(By.css('.marker')).nativeElement as HTMLElement;
    expect(parseFloat(marker.style.width)).toBeCloseTo(100 / 7 - 1);
    expect(component.backgroundColor()).toBe('#17723f');
  });
});

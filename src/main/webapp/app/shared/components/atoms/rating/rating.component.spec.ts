import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';
import { provideAnimations } from '@angular/platform-browser/animations';

import { RatingComponent } from './rating.component';

describe('RatingComponent', () => {
  let component: RatingComponent;
  let fixture: ComponentFixture<RatingComponent>;

  const mockGetComputedStyle = {
    getPropertyValue(prop: string) {
      switch (prop) {
        case '--p-success-200':
          return '#00ff00';
        case '--p-success-700':
          return '#008800';
        case '--p-warn-400':
          return '#ffff00';
        case '--p-danger-700':
          return '#ff0000';
        case '--p-warn-500':
          return '#ffee00';
        default:
          return '';
      }
    },
  } as unknown as CSSStyleDeclaration;

  beforeEach(async () => {
    jest.spyOn(window, 'getComputedStyle').mockImplementation(() => mockGetComputedStyle);

    await TestBed.configureTestingModule({
      imports: [RatingComponent, TranslateModule.forRoot()],
      providers: [
        TranslateStore,
        TranslateLoader,
        TranslateCompiler,
        TranslateParser,
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        TranslateService,
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute correct min and max for default likertScale=5', () => {
    expect(component.min()).toBe(-2);
    expect(component.max()).toBe(2);
  });

  it('should compute markerWidthPercent correctly for default likertScale=5', () => {
    expect(component.markerWidthPercent()).toBe('18%'); // 100/5=20 → 20−2=18
  });

  it('should return empty offsetPercent when rating is undefined', () => {
    expect(component.offsetPercent()).toBe('');
  });

  it('should compute offsetPercent correctly when rating equals min or max', () => {
    fixture.componentRef.setInput('rating', -2);
    fixture.detectChanges();
    expect(component.offsetPercent()).toBe('10%');

    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();
    expect(component.offsetPercent()).toBe('90%');
  });

  it('should compute backgroundColor correctly for negative, neutral, and positive ratings', () => {
    fixture.componentRef.setInput('rating', -2);
    fixture.detectChanges();
    expect(component.backgroundColor()).toBe('#ff0000');

    fixture.componentRef.setInput('rating', 0);
    fixture.detectChanges();
    expect(component.backgroundColor()).toBe('#ffee00');

    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();
    expect(component.backgroundColor()).toBe('#008800');
  });

  it('getAriaParams should return correct translation keys', () => {
    fixture.componentRef.setInput('rating', undefined);
    fixture.detectChanges();
    expect(component.ariaParams()).toBe('evaluation.noRating');

    fixture.componentRef.setInput('rating', 1);
    fixture.detectChanges();
    expect(component.ariaParams()).toBe('evaluation.ratingToolTip');
  });

  it('getLabelKey should return correct label key based on rating value', () => {
    fixture.componentRef.setInput('rating', -1);
    fixture.detectChanges();
    expect(component.labelKey()).toBe('evaluation.negative');

    fixture.componentRef.setInput('rating', 0);
    fixture.detectChanges();
    expect(component.labelKey()).toBe('evaluation.neutral');

    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();
    expect(component.labelKey()).toBe('evaluation.positive');

    fixture.componentRef.setInput('rating', undefined);
    fixture.detectChanges();
    expect(component.labelKey()).toBe('');
  });
});

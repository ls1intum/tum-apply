import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

import { ApplicationCarouselComponent } from 'app/shared/components/organisms/application-carousel/application-carousel.component';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { BREAKPOINT_QUERIES } from 'app/shared/constants/breakpoints';

describe('ApplicationCarouselComponent', () => {
  let fixture: ComponentFixture<ApplicationCarouselComponent>;
  let component: ApplicationCarouselComponent;

  const makeApp = (id: string): ApplicationEvaluationDetailDTO =>
    ({
      applicationId: id,
      jobId: `job-${id}`,
      applicantName: `Name ${id}`,
    }) as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApplicationCarouselComponent],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        {
          provide: BreakpointObserver,
          useValue: {
            observe: vi.fn().mockReturnValue(of({ breakpoints: {} })),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ApplicationCarouselComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('windowSize', 3);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------- BREAKPOINT EFFECT ----------------
  describe('breakpoint effect', () => {
    it('should default cardsVisible to 3 on desktop breakpoints', () => {
      expect(component.cardsVisible()).toBe(3);
    });

    it('should set cardsVisible to 1 on onlyMobile breakpoint', () => {
      const bpMock = TestBed.inject(BreakpointObserver) as any;
      bpMock.observe.mockReturnValueOnce(of({ breakpoints: { [BREAKPOINT_QUERIES.onlyMobile]: true } }));

      fixture = TestBed.createComponent(ApplicationCarouselComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('windowSize', 3);
      fixture.detectChanges();

      expect(component.cardsVisible()).toBe(1);
    });

    it('should set cardsVisible to 5 on ultraWide breakpoint', () => {
      const bpMock = TestBed.inject(BreakpointObserver) as any;
      bpMock.observe.mockReturnValueOnce(of({ breakpoints: { [BREAKPOINT_QUERIES.ultraWide]: true } }));

      fixture = TestBed.createComponent(ApplicationCarouselComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('windowSize', 3);
      fixture.detectChanges();

      expect(component.cardsVisible()).toBe(5);
    });

    it('should set cardsVisible to 3 when no matching breakpoints', () => {
      const bpMock = TestBed.inject(BreakpointObserver) as any;
      bpMock.observe.mockReturnValueOnce(of({ breakpoints: { foo: true } }));

      fixture = TestBed.createComponent(ApplicationCarouselComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('windowSize', 3);
      fixture.detectChanges();

      expect(component.cardsVisible()).toBe(3);
    });

    it('should handle empty applications array', () => {
      fixture.componentRef.setInput('applications', []);
      fixture.componentRef.setInput('windowIndex', 0);
      component.cardsVisible.set(3);
      fixture.detectChanges();

      const result = component.visibleApps();
      expect(result.length).toBe(3);
      expect(result.every(app => app === undefined)).toBe(true);
    });

    it('should ignore effect when result is null', () => {
      const bpMock = TestBed.inject(BreakpointObserver) as any;
      bpMock.observe.mockReturnValueOnce(of(null));

      fixture = TestBed.createComponent(ApplicationCarouselComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('windowSize', 3);
      fixture.detectChanges();

      expect(component.cardsVisible()).toBe(3);
    });
  });

  // ---------------- SIGNAL COMPUTATIONS ----------------
  describe('signal computations', () => {
    it('should mark start when currentIndex is 0', () => {
      fixture.componentRef.setInput('currentIndex', 0);
      fixture.componentRef.setInput('totalRecords', 5);
      fixture.detectChanges();

      expect(component.isStart()).toBe(true);
    });

    it('should not mark start when currentIndex > 0', () => {
      fixture.componentRef.setInput('currentIndex', 2);
      fixture.componentRef.setInput('totalRecords', 5);
      fixture.detectChanges();

      expect(component.isStart()).toBe(false);
    });

    it('should mark end when currentIndex is last record', () => {
      fixture.componentRef.setInput('currentIndex', 4);
      fixture.componentRef.setInput('totalRecords', 5);
      fixture.detectChanges();

      expect(component.isEnd()).toBe(true);
    });

    it('should mark end when no records exist', () => {
      fixture.componentRef.setInput('currentIndex', 0);
      fixture.componentRef.setInput('totalRecords', 0);
      fixture.detectChanges();

      expect(component.isEnd()).toBe(true);
    });

    it('should not mark end when currentIndex is before last', () => {
      fixture.componentRef.setInput('currentIndex', 2);
      fixture.componentRef.setInput('totalRecords', 5);
      fixture.detectChanges();

      expect(component.isEnd()).toBe(false);
    });
  });

  // ---------------- VISIBLE APPLICATIONS ----------------
  describe('visible applications', () => {
    it('should compute visible apps with no fillers when in bounds', () => {
      const a1 = makeApp('a1');
      const a2 = makeApp('a2');
      const a3 = makeApp('a3');

      fixture.componentRef.setInput('applications', [a1, a2, a3]);
      fixture.componentRef.setInput('windowIndex', 1);
      component.cardsVisible.set(3);
      fixture.detectChanges();

      const result = component.visibleApps();
      expect(result.length).toBe(3);
      expect(result[0]).toBe(a1);
      expect(result[1]).toBe(a2);
      expect(result[2]).toBe(a3);
    });

    it('should fill undefined when index out of bounds', () => {
      const a1 = makeApp('a1');

      fixture.componentRef.setInput('applications', [a1]);
      fixture.componentRef.setInput('windowIndex', 0);
      component.cardsVisible.set(3);
      fixture.detectChanges();

      const result = component.visibleApps();
      expect(result.length).toBe(3);
      expect(result[0]).toBeUndefined();
      expect(result[1]).toBe(a1);
      expect(result[2]).toBeUndefined();
    });
  });

  // ---------------- MIDDLE INDEX ----------------
  describe('middle index', () => {
    it('should compute middle index correctly', () => {
      component.cardsVisible.set(5);
      expect(component.middle()).toBe(2);

      component.cardsVisible.set(3);
      expect(component.middle()).toBe(1);

      component.cardsVisible.set(1);
      expect(component.middle()).toBe(0);
    });

    it('should compute middle correctly for even cardsVisible', () => {
      component.cardsVisible.set(4);
      expect(component.middle()).toBe(2);

      component.cardsVisible.set(6);
      expect(component.middle()).toBe(3);
    });
  });

  // ---------------- OUTPUT EVENTS ----------------
  describe('output events', () => {
    it('should emit next event when loadNext is called', () => {
      const spy = vi.fn();
      component.next.subscribe(spy);

      component.loadNext();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit prev event when loadPrev is called', () => {
      const spy = vi.fn();
      component.prev.subscribe(spy);

      component.loadPrev();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------- KEYBOARD HANDLING ----------------
  describe('keyboard handling', () => {
    it('should call loadNext when ArrowRight is pressed', () => {
      const spy = vi.spyOn(component, 'loadNext');

      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call loadPrev when ArrowLeft is pressed', () => {
      const spy = vi.spyOn(component, 'loadPrev');

      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not call navigation methods for other keys', () => {
      const spyNext = vi.spyOn(component, 'loadNext');
      const spyPrev = vi.spyOn(component, 'loadPrev');

      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(spyNext).not.toHaveBeenCalled();
      expect(spyPrev).not.toHaveBeenCalled();
    });
  });
});

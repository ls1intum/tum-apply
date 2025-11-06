import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

import { ApplicationCarouselComponent } from 'app/shared/components/organisms/application-carousel/application-carousel.component';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { BREAKPOINT_QUERIES } from 'app/shared/constants/breakpoints';
import { ApplicationDetailDTO } from 'app/generated/model/applicationDetailDTO';
import { ProfessorDTO } from 'app/generated/model/professorDTO';

describe('ApplicationCarouselComponent', () => {
  let fixture: ComponentFixture<ApplicationCarouselComponent>;
  let component: ApplicationCarouselComponent;

  const mockApplicationDetail = (id: string): ApplicationDetailDTO => ({
    applicationId: id,
    jobId: `job-${id}`,
    researchGroup: `Group ${id}`,
    supervisingProfessorName: `Prof. ${id}`,
    applicationState: ApplicationDetailDTO.ApplicationStateEnum.Sent,
  });

  const mockProfessor = (id: string): ProfessorDTO => ({
    firstName: `ProfFirst${id}`,
    lastName: `ProfLast${id}`,
    email: `prof${id}@example.com`,
    researchGroupName: `Group ${id}`,
  });

  const mockApplication = (id: string): ApplicationEvaluationDetailDTO => ({
    applicationDetailDTO: mockApplicationDetail(id),
    jobId: `job-${id}`,
    professor: mockProfessor(id),
    appliedAt: new Date().toISOString(),
  });

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

    fixture.componentRef.setInput('carouselSize', 3);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------- BREAKPOINT EFFECT ----------------
  describe('breakpoint effect', () => {
    beforeEach(() => {
      vi.restoreAllMocks();

      const fakeContainer = document.createElement('div');
      fakeContainer.classList.add('page-container');
      document.body.appendChild(fakeContainer);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    function setup(width: number) {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(width);

      const container = document.querySelector('.page-container') as HTMLElement;
      Object.defineProperty(container, 'clientWidth', { configurable: true, value: width });

      fixture = TestBed.createComponent(ApplicationCarouselComponent);
      component = fixture.componentInstance;

      fixture.componentRef.setInput('carouselSize', 3);
      fixture.detectChanges();

      component['updateVisibleCards']();
    }

    it('sets 1 when width < md', () => {
      setup(600);
      expect(component.cardsVisible()).toBe(1);
    });

    it('sets 2 when width between md and smallDesktop', () => {
      setup(780);
      expect(component.cardsVisible()).toBe(2);
    });

    it('sets 3 when width between smallDesktop and xl', () => {
      setup(1000);
      expect(component.cardsVisible()).toBe(3);
    });

    it('sets 5 when width between xl and ultraWide', () => {
      setup(1600);
      expect(component.cardsVisible()).toBe(5);
    });

    it('sets 6 when width ≥ ultraWide', () => {
      setup(2100);
      expect(component.cardsVisible()).toBe(6);
    });
  });
  // ---------------- VISIBLE APPLICATIONS ----------------
  describe('visible applications', () => {
    it('should compute visible apps with no fillers when in bounds', () => {
      const a1 = mockApplication('a1');
      const a2 = mockApplication('a2');
      const a3 = mockApplication('a3');

      fixture.componentRef.setInput('applications', [a1, a2, a3]);
      fixture.componentRef.setInput('carouselIndex', 1);
      component.cardsVisible.set(3);
      fixture.detectChanges();

      const result = component.visibleApplications();
      expect(result.length).toBe(3);
      expect(result[0]).toBe(a1);
      expect(result[1]).toBe(a2);
      expect(result[2]).toBe(a3);
    });

    it('should fill undefined when index out of bounds', () => {
      const a1 = mockApplication('a1');

      fixture.componentRef.setInput('applications', [a1]);
      fixture.componentRef.setInput('carouselIndex', 0);
      component.cardsVisible.set(3);
      fixture.detectChanges();

      const result = component.visibleApplications();
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

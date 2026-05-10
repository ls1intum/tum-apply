import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

import { ApplicationCarouselComponent } from 'app/shared/components/organisms/application-carousel/application-carousel.component';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/application-evaluation-detail-dto';
import { ApplicationDetailDTO, ApplicationDetailDTOApplicationStateEnum } from 'app/generated/model/application-detail-dto';
import { ProfessorDTO } from 'app/generated/model/professor-dto';

describe('ApplicationCarouselComponent', () => {
  let fixture: ComponentFixture<ApplicationCarouselComponent>;
  let component: ApplicationCarouselComponent;

  const mockApplicationDetail = (id: string): ApplicationDetailDTO => ({
    applicationId: id,
    jobId: `job-${id}`,
    researchGroup: `Group ${id}`,
    supervisingProfessorName: `Prof. ${id}`,
    applicationState: ApplicationDetailDTOApplicationStateEnum.Sent,
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

    it.each<[number, number]>([
      [600, 1],
      [780, 2],
      [1000, 3],
      [1600, 5],
      [2100, 6],
    ])('should set cardsVisible based on width: width=%i -> %i cards', (width, expected) => {
      setup(width);
      expect(component.cardsVisible()).toBe(expected);
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
    it.each<[number, number]>([
      [1, 0],
      [3, 1],
      [4, 2],
      [5, 2],
      [6, 3],
    ])('should compute middle index for cardsVisible=%i as %i', (cardsVisible, expected) => {
      component.cardsVisible.set(cardsVisible);
      expect(component.middle()).toBe(expected);
    });
  });

  // ---------------- OUTPUT EVENTS ----------------
  describe('output events', () => {
    it('should emit next event when loadNext is called', () => {
      const spy = vi.fn();
      component.next.subscribe(spy);

      component.loadNext();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should emit prev event when loadPrev is called', () => {
      const spy = vi.fn();
      component.prev.subscribe(spy);

      component.loadPrev();

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  // ---------------- KEYBOARD HANDLING ----------------
  describe('keyboard handling', () => {
    it('should call loadNext when ArrowRight is pressed', () => {
      const spy = vi.spyOn(component, 'loadNext');

      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should call loadPrev when ArrowLeft is pressed', () => {
      const spy = vi.spyOn(component, 'loadPrev');

      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should not call navigation methods for other keys', () => {
      const spyNext = vi.spyOn(component, 'loadNext');
      const spyPrev = vi.spyOn(component, 'loadPrev');

      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(spyNext).not.toHaveBeenCalled();
      expect(spyPrev).not.toHaveBeenCalled();
    });

    it('should not navigate when focus is inside a textarea', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const spyNext = vi.spyOn(component, 'loadNext');
      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(spyNext).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should not navigate when focus is inside an input', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const spyPrev = vi.spyOn(component, 'loadPrev');
      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

      expect(spyPrev).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not navigate when an element with contenteditable is focused', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      document.body.appendChild(div);
      div.focus();

      const spyNext = vi.spyOn(component, 'loadNext');
      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(spyNext).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should not navigate when modifier keys are pressed', () => {
      const spyNext = vi.spyOn(component, 'loadNext');
      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true }));
      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true }));
      component.handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true }));

      expect(spyNext).not.toHaveBeenCalled();
    });

    it('should not navigate when event already prevented', () => {
      const spyNext = vi.spyOn(component, 'loadNext');
      const ev = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(ev, 'defaultPrevented', { get: () => true });

      component.handleGlobalKeyDown(ev);

      expect(spyNext).not.toHaveBeenCalled();
    });
  });
});

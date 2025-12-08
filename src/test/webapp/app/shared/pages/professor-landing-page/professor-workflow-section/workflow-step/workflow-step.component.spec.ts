import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { WorkflowStepComponent } from 'app/shared/pages/professor-landing-page/professor-workflow-section/workflow-step/workflow-step.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('WorkflowStepComponent', () => {
  let fixture: ComponentFixture<WorkflowStepComponent>;
  let component: WorkflowStepComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowStepComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowStepComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should have default icon value', () => {
      fixture.detectChanges();
      expect(component.icon()).toBe('file-pen');
    });

    it('should accept custom icon value', () => {
      fixture.componentRef.setInput('icon', 'calendar');
      fixture.detectChanges();
      expect(component.icon()).toBe('calendar');
    });

    it('should have default empty title', () => {
      fixture.detectChanges();
      expect(component.title()).toBe('');
    });

    it('should accept custom title value', () => {
      fixture.componentRef.setInput('title', 'Test Title');
      fixture.detectChanges();
      expect(component.title()).toBe('Test Title');
    });

    it('should have default empty description', () => {
      fixture.detectChanges();
      expect(component.description()).toBe('');
    });

    it('should accept custom description value', () => {
      fixture.componentRef.setInput('description', 'Test Description');
      fixture.detectChanges();
      expect(component.description()).toBe('Test Description');
    });
  });

  describe('Multiple Input Properties', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('icon', 'calendar');
      fixture.componentRef.setInput('title', 'Schedule Interview');
      fixture.componentRef.setInput('description', 'Set up an interview with the candidate');
      fixture.detectChanges();
    });

    it('should handle multiple inputs correctly', () => {
      expect(component.icon()).toBe('calendar');
      expect(component.title()).toBe('Schedule Interview');
      expect(component.description()).toBe('Set up an interview with the candidate');
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('icon', 'calendar');
      fixture.componentRef.setInput('title', 'Test Step Title');
      fixture.componentRef.setInput('description', 'Test step description');
      fixture.detectChanges();
    });

    it('should render title when provided', () => {
      const titleElement = nativeElement.querySelector('h3');
      expect(titleElement).not.toBeNull();
    });

    it('should render description when provided', () => {
      const descriptionElement = nativeElement.querySelector('p');
      expect(descriptionElement).not.toBeNull();
    });
  });

  describe('Input Signals Reactivity', () => {
    it('should update when icon input changes', () => {
      fixture.componentRef.setInput('icon', 'calendar');
      fixture.detectChanges();
      expect(component.icon()).toBe('calendar');

      fixture.componentRef.setInput('icon', 'file-pen');
      fixture.detectChanges();
      expect(component.icon()).toBe('file-pen');
    });

    it('should update when title input changes', () => {
      fixture.componentRef.setInput('title', 'Initial Title');
      fixture.detectChanges();
      expect(component.title()).toBe('Initial Title');

      fixture.componentRef.setInput('title', 'Updated Title');
      fixture.detectChanges();
      expect(component.title()).toBe('Updated Title');
    });

    it('should update when description input changes', () => {
      fixture.componentRef.setInput('description', 'Initial Description');
      fixture.detectChanges();
      expect(component.description()).toBe('Initial Description');

      fixture.componentRef.setInput('description', 'Updated Description');
      fixture.detectChanges();
      expect(component.description()).toBe('Updated Description');
    });
  });
});

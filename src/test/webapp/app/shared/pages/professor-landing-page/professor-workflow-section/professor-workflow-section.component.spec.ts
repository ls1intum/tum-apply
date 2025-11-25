import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ProfessorWorkflowSectionComponent } from 'app/shared/pages/professor-landing-page/professor-workflow-section/professor-workflow-section.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('ProfessorWorkflowSectionComponent', () => {
  let fixture: ComponentFixture<ProfessorWorkflowSectionComponent>;
  let component: ProfessorWorkflowSectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorWorkflowSectionComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorWorkflowSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Translation Key Configuration', () => {
    it('should have correct translation key', () => {
      expect(component.translationKey).toBe('professorLandingPage.workflow.steps');
    });
  });

  describe('Workflow Steps Configuration', () => {
    it('should have exactly four workflow steps', () => {
      expect(component.steps).toHaveLength(4);
    });

    it('should configure create-job step correctly', () => {
      const createJobStep = component.steps[0];
      expect(createJobStep.icon).toBe('create-job');
      expect(createJobStep.title).toBe('professorLandingPage.workflow.steps.1.title');
      expect(createJobStep.description).toBe('professorLandingPage.workflow.steps.1.description');
    });

    it('should configure application-overview step correctly', () => {
      const applicationOverviewStep = component.steps[1];
      expect(applicationOverviewStep.icon).toBe('application-overview');
      expect(applicationOverviewStep.title).toBe('professorLandingPage.workflow.steps.2.title');
      expect(applicationOverviewStep.description).toBe('professorLandingPage.workflow.steps.2.description');
    });

    it('should configure review-applications step correctly', () => {
      const reviewApplicationsStep = component.steps[2];
      expect(reviewApplicationsStep.icon).toBe('review-applications');
      expect(reviewApplicationsStep.title).toBe('professorLandingPage.workflow.steps.3.title');
      expect(reviewApplicationsStep.description).toBe('professorLandingPage.workflow.steps.3.description');
    });

    it('should configure calendar step correctly', () => {
      const calendarStep = component.steps[3];
      expect(calendarStep.icon).toBe('calendar');
      expect(calendarStep.title).toBe('professorLandingPage.workflow.steps.4.title');
      expect(calendarStep.description).toBe('professorLandingPage.workflow.steps.4.description');
    });
  });

  describe('Steps Data Integrity', () => {
    it('should have all required properties for each step', () => {
      component.steps.forEach(step => {
        expect(step.icon).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
      });
    });

    it('should have unique icons for each step', () => {
      const icons = component.steps.map(step => step.icon);
      const uniqueIcons = new Set(icons);
      expect(uniqueIcons.size).toBe(icons.length);
    });

    it('should have unique titles for each step', () => {
      const titles = component.steps.map(step => step.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('should have unique descriptions for each step', () => {
      const descriptions = component.steps.map(step => step.description);
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(descriptions.length);
    });
  });

  describe('Template Rendering', () => {
    it('should render the section title', () => {
      const title = nativeElement.querySelector('h2');
      expect(title).not.toBeNull();
    });

    it('should render one workflow step component per entry in the steps array', () => {
      const workflowSteps = nativeElement.querySelectorAll('jhi-workflow-step');
      expect(workflowSteps).toHaveLength(component.steps.length);
    });

    it('should render exactly four workflow step components', () => {
      const workflowSteps = nativeElement.querySelectorAll('jhi-workflow-step');
      expect(workflowSteps).toHaveLength(4);
    });
  });
});

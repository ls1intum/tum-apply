import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ProfessorFaqSectionComponent } from 'app/shared/pages/professor-landing-page/professor-faq-section/professor-faq-section.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('ProfessorFaqSectionComponent', () => {
  let fixture: ComponentFixture<ProfessorFaqSectionComponent>;
  let component: ProfessorFaqSectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorFaqSectionComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorFaqSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Translation Key', () => {
    it('should have correct translation key', () => {
      expect(component.translationKey).toBe('professorLandingPage.faq.questions');
    });
  });

  describe('FAQ Tabs Configuration', () => {
    it('should have exactly four FAQ tabs', () => {
      expect(component.tabs.length).toBe(4);
    });

    it('should configure login tab correctly', () => {
      const loginTab = component.tabs[0];
      expect(loginTab.value).toBe('login');
      expect(loginTab.title).toBe('professorLandingPage.faq.questions.login.title');
      expect(loginTab.content).toBe('professorLandingPage.faq.questions.login.content');
    });

    it('should configure multiple-applications tab correctly', () => {
      const multipleAppsTab = component.tabs[1];
      expect(multipleAppsTab.value).toBe('multiple-applications');
      expect(multipleAppsTab.title).toBe('professorLandingPage.faq.questions.multipleApplications.title');
      expect(multipleAppsTab.content).toBe('professorLandingPage.faq.questions.multipleApplications.content');
    });

    it('should configure documents tab correctly', () => {
      const documentsTab = component.tabs[2];
      expect(documentsTab.value).toBe('documents');
      expect(documentsTab.title).toBe('professorLandingPage.faq.questions.documents.title');
      expect(documentsTab.content).toBe('professorLandingPage.faq.questions.documents.content');
    });

    it('should configure status tab correctly', () => {
      const statusTab = component.tabs[3];
      expect(statusTab.value).toBe('status');
      expect(statusTab.title).toBe('professorLandingPage.faq.questions.status.title');
      expect(statusTab.content).toBe('professorLandingPage.faq.questions.status.content');
    });
  });

  describe('Icon Configuration', () => {
    it('should have correct FontAwesome icon', () => {
      expect(component.faArrowUpRightFromSquare).toBeDefined();
    });
  });

  describe('Template Rendering', () => {
    it('should render the section title', () => {
      const title = nativeElement.querySelector('h2');
      expect(title).not.toBeNull();
    });

    it('should render accordion component', () => {
      const accordion = nativeElement.querySelector('p-accordion');
      expect(accordion).not.toBeNull();
    });
  });

  describe('Tabs Data Integrity', () => {
    it('should have unique values for each tab', () => {
      const values = component.tabs.map(tab => tab.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have all required properties for each tab', () => {
      component.tabs.forEach(tab => {
        expect(tab.value).toBeTruthy();
        expect(tab.title).toBeTruthy();
        expect(tab.content).toBeTruthy();
      });
    });
  });
});

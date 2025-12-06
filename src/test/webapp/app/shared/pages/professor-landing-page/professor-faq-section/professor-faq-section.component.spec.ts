import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ProfessorFaqSectionComponent } from 'app/shared/pages/professor-landing-page/professor-faq-section/professor-faq-section.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideHttpClientMock } from 'util/http-client.mock';
import { createDialogServiceMock, DialogServiceMock, provideDialogServiceMock } from '../../../../../util/dialog.service.mock';
import { OnboardingDialog } from 'app/shared/components/molecules/onboarding-dialog/onboarding-dialog';

describe('ProfessorFaqSectionComponent', () => {
  let fixture: ComponentFixture<ProfessorFaqSectionComponent>;
  let component: ProfessorFaqSectionComponent;
  let nativeElement: HTMLElement;
  let mockDialogService: DialogServiceMock;

  beforeEach(async () => {
    mockDialogService = createDialogServiceMock();

    await TestBed.configureTestingModule({
      imports: [ProfessorFaqSectionComponent],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideNoopAnimations(),
        provideHttpClientMock(),
        provideDialogServiceMock(mockDialogService),
      ],
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
      expect(component.tabs).toHaveLength(5);
    });

    it('should configure registration tab correctly', () => {
      const loginTab = component.tabs[0];
      expect(loginTab.value).toBe('registration');
      expect(loginTab.title).toBe('professorLandingPage.faq.questions.registration.title');
      expect(loginTab.content).toBe('professorLandingPage.faq.questions.registration.content');
    });

    it('should configure login tab correctly', () => {
      const loginTab = component.tabs[1];
      expect(loginTab.value).toBe('login');
      expect(loginTab.title).toBe('professorLandingPage.faq.questions.login.title');
      expect(loginTab.content).toBe('professorLandingPage.faq.questions.login.content');
    });

    it('should configure multiple-applications tab correctly', () => {
      const multipleAppsTab = component.tabs[2];
      expect(multipleAppsTab.value).toBe('multiple-applications');
      expect(multipleAppsTab.title).toBe('professorLandingPage.faq.questions.multipleApplications.title');
      expect(multipleAppsTab.content).toBe('professorLandingPage.faq.questions.multipleApplications.content');
    });

    it('should configure documents tab correctly', () => {
      const documentsTab = component.tabs[3];
      expect(documentsTab.value).toBe('documents');
      expect(documentsTab.title).toBe('professorLandingPage.faq.questions.documents.title');
      expect(documentsTab.content).toBe('professorLandingPage.faq.questions.documents.content');
    });

    it('should configure status tab correctly', () => {
      const statusTab = component.tabs[4];
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
      expect(uniqueValues).toHaveLength(values.length);
    });

    it('should have all required properties for each tab', () => {
      component.tabs.forEach(tab => {
        expect(tab.value).toBeTruthy();
        expect(tab.title).toBeTruthy();
        expect(tab.content).toBeTruthy();
      });
    });
  });

  describe('openRegistrationForm', () => {
    it('should open onboarding dialog with correct header', () => {
      const openSpy = vi.spyOn(mockDialogService, 'open');

      component.openRegistrationForm();

      expect(openSpy).toHaveBeenCalledTimes(1);
      const [componentType, config] = openSpy.mock.calls[0];
      expect(componentType).toBe(OnboardingDialog);
      expect(config).toMatchObject({
        header: 'onboarding.title',
      });
    });
  });
});

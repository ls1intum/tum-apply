import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ProfessorBenefitsSectionComponent } from 'app/shared/pages/professor-landing-page/professor-benefits-section/professor-benefits-section.component';
import { provideTranslateMock } from 'util/translate.mock';
import { createRouterMock, provideRouterMock } from 'util/router.mock';

describe('ProfessorBenefitsSectionComponent', () => {
  let fixture: ComponentFixture<ProfessorBenefitsSectionComponent>;
  let component: ProfessorBenefitsSectionComponent;
  let nativeElement: HTMLElement;
  let routerMock: ReturnType<typeof createRouterMock>;

  beforeEach(async () => {
    routerMock = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [ProfessorBenefitsSectionComponent],
      providers: [provideTranslateMock(), provideRouterMock(routerMock)],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorBenefitsSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Button Configuration', () => {
    it('should return button group data with horizontal direction', () => {
      const buttonData = component.buttons();
      expect(buttonData.direction).toBe('horizontal');
    });

    it('should have exactly two buttons', () => {
      const buttonData = component.buttons();
      expect(buttonData.buttons.length).toBe(2);
    });

    it('should configure first button correctly', () => {
      const buttonData = component.buttons();
      const firstButton = buttonData.buttons[0];

      expect(firstButton.label).toBe('professorLandingPage.platformBenefits.button1');
      expect(firstButton.severity).toBe('secondary');
      expect(firstButton.variant).toBe('outlined');
      expect(firstButton.disabled).toBe(false);
      expect(firstButton.isExternalLink).toBe(false);
    });

    it('should configure second button correctly', () => {
      const buttonData = component.buttons();
      const secondButton = buttonData.buttons[1];

      expect(secondButton.label).toBe('professorLandingPage.platformBenefits.button2');
      expect(secondButton.severity).toBe('primary');
      expect(secondButton.disabled).toBe(true);
      expect(secondButton.isExternalLink).toBe(false);
    });
  });

  describe('Button Navigation', () => {
    it('should navigate to job-overview when first button is clicked', () => {
      const buttonData = component.buttons();
      buttonData.buttons[0].onClick?.();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/job-overview']);
    });

    it('should have navigation handler on second button', () => {
      const buttonData = component.buttons();
      expect(buttonData.buttons[1].onClick).toBeDefined();
    });

    it('should navigate to job-overview when second button is clicked', () => {
      const buttonData = component.buttons();
      buttonData.buttons[1].onClick?.();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/job-overview']);
    });
  });

  describe('Template Rendering', () => {
    it('should render the section title', () => {
      const title = nativeElement.querySelector('h2');
      expect(title).not.toBeNull();
    });

    it('should render the section description', () => {
      const description = nativeElement.querySelector('p');
      expect(description).not.toBeNull();
    });
  });
});

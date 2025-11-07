import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { ApplicationStepsSectionComponent } from 'app/shared/pages/landing-page/application-steps-section/application-steps-section.component';
import { ApplicationStepComponent } from 'app/shared/pages/landing-page/application-steps-section/application-step/application-step/application-step.component';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';

describe('ApplicationStepsSectionComponent', () => {
  let component: ApplicationStepsSectionComponent;
  let fixture: ComponentFixture<ApplicationStepsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStepsSectionComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationStepsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the section headline', () => {
    const headlineEl = fixture.nativeElement.querySelector('h2');
    expect(headlineEl).toBeTruthy();
    expect(headlineEl?.getAttribute('jhitranslate')).toBe('landingPage.applicationSteps.headline');
  });

  it('should have 5 application steps defined', () => {
    expect(component.steps).toHaveLength(5);
  });

  it('should render all application steps', () => {
    const stepComponents = fixture.debugElement.queryAll(By.directive(ApplicationStepComponent));
    expect(stepComponents).toHaveLength(5);
  });

  it('should pass correct props to each step component', () => {
    const stepComponents = fixture.debugElement.queryAll(By.directive(ApplicationStepComponent));

    stepComponents.forEach((stepDebug, index) => {
      const stepInstance = stepDebug.componentInstance;
      const expectedStep = component.steps[index];

      expect(stepInstance.index()).toBe(index);
      expect(stepInstance.icon()).toBe(expectedStep.icon);
      expect(stepInstance.title()).toBe(expectedStep.title);
      expect(stepInstance.description()).toBe(expectedStep.description);
    });
  });
});

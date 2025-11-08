import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { ApplicationStepComponent } from 'app/shared/pages/landing-page/application-steps-section/application-step/application-step/application-step.component';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ButtonStubComponent } from 'src/test/webapp/util/button.stub';

describe('ApplicationStepComponent', () => {
  let component: ApplicationStepComponent;
  let fixture: ComponentFixture<ApplicationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStepComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    })
      .overrideComponent(ApplicationStepComponent, {
        remove: {
          imports: [ButtonComponent],
        },
        add: {
          imports: [ButtonStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render button with correct icon', () => {
    fixture.componentRef.setInput('icon', 'bell');
    fixture.detectChanges();

    const buttonDebug = fixture.debugElement.query(By.directive(ButtonStubComponent));
    expect(buttonDebug?.componentInstance.icon()).toBe('bell');
  });

  it('should render title with index and translation key', () => {
    fixture.componentRef.setInput('title', 'landingPage.applicationSteps.steps.checkPrerequisites.title');
    fixture.componentRef.setInput('index', 2);
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('h3');
    expect(titleEl?.textContent).toContain('3.');

    const spanEl = titleEl?.querySelector('span');
    expect(spanEl?.textContent.trim()).toBe('landingPage.applicationSteps.steps.checkPrerequisites.title');
  });

  it('should render description with translation key', () => {
    fixture.componentRef.setInput('description', 'landingPage.applicationSteps.steps.checkPrerequisites.description');
    fixture.detectChanges();

    const descEl = fixture.nativeElement.querySelector('p');
    expect(descEl?.textContent.trim()).toBe('landingPage.applicationSteps.steps.checkPrerequisites.description');
  });

  it('should use default icon when not provided', () => {
    fixture.detectChanges();

    const buttonDebug = fixture.debugElement.query(By.directive(ButtonStubComponent));
    expect(buttonDebug?.componentInstance.icon()).toBe('search');
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, Input } from '@angular/core';

import { ApplicationStepsSectionComponent } from 'app/shared/pages/landing-page/application-steps-section/application-steps-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';

@Component({
  selector: 'jhi-application-step',
  standalone: true,
  template: '',
})
class StubApplicationStepComponent {
  @Input() icon!: string;
  @Input() title!: string;
  @Input() description!: string;
}

describe('ApplicationStepsSectionComponent', () => {
  let fixture: ComponentFixture<ApplicationStepsSectionComponent>;
  let component: ApplicationStepsSectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStepsSectionComponent, StubApplicationStepComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationStepsSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render four application-step components', () => {
    const stepElements = nativeElement.querySelectorAll('jhi-application-step');
    expect(stepElements.length).toBe(4);
  });

  it('should bind correct translation keys in steps', () => {
    expect(component.steps.length).toBe(4);

    component.steps.forEach((step, index) => {
      expect(step.title).toBe(`landingPage.applicationSteps.steps.${index + 1}.title`);
      expect(step.description).toBe(`landingPage.applicationSteps.steps.${index + 1}.description`);
    });
  });

  it('should render the headline with the correct translate key', () => {
    const headline = nativeElement.querySelector('h2.title');
    expect(headline).not.toBeNull();
    expect(headline?.getAttribute('jhiTranslate')).toBe('landingPage.applicationSteps.headline');
  });
});

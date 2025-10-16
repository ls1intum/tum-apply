import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { ApplicationStepComponent } from 'app/shared/pages/landing-page/application-steps-section/application-step/application-step/application-step.component';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ButtonStubComponent } from 'src/test/webapp/util/button.stub';

describe('ApplicationStepComponent', () => {
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
  });

  it('should render inputs correctly', () => {
    fixture.componentRef.setInput('icon', 'bell');
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('description', 'Test Description');
    fixture.detectChanges();

    const buttonDebug = fixture.debugElement.query(By.directive(ButtonStubComponent));

    expect(buttonDebug?.componentInstance.icon()).toBe('bell');
    const titleEl = fixture.nativeElement.querySelector('h3.title');
    const descEl = fixture.nativeElement.querySelector('p.description');

    expect(titleEl?.textContent).toBe('Test Title');
    expect(descEl?.textContent).toBe('Test Description');
  });
});

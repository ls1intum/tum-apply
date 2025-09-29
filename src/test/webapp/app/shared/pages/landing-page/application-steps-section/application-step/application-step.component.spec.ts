import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ApplicationStepComponent } from 'app/shared/pages/landing-page/application-steps-section/application-step/application-step/application-step.component';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-button',
  standalone: true,
  template: '',
})
class StubButtonComponent {
  @Input() icon!: string;
  @Input() severity!: string;
}

describe('ApplicationStepComponent', () => {
  let fixture: ComponentFixture<ApplicationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStepComponent, TranslateModule, FontAwesomeModule],
      providers: [provideFontAwesomeTesting()],
    })
      .overrideComponent(ApplicationStepComponent, {
        remove: {
          imports: [ButtonComponent],
        },
        add: {
          imports: [StubButtonComponent],
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

    const buttonDebug = fixture.debugElement.query(By.directive(StubButtonComponent));
    const titleEl = fixture.nativeElement.querySelector('h3.title');
    const descEl = fixture.nativeElement.querySelector('p.description');

    expect(buttonDebug?.componentInstance.icon).toBe('bell');
    expect(titleEl?.textContent).toBe('Test Title');
    expect(descEl?.textContent).toBe('Test Description');
  });
});

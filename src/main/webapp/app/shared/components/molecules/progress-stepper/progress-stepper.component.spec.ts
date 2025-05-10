import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressStepperComponent, StepData } from './progress-stepper.component';
import { Component, ComponentRef, TemplateRef, ViewChild } from '@angular/core';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faSave } from '@fortawesome/free-solid-svg-icons';

@Component({
  template: `
    <ng-template #testTemplate>
      <p>Mock Content</p>
    </ng-template>
    <jhi-progress-stepper></jhi-progress-stepper>
  `,
})
class TestHostComponent {
  @ViewChild('testTemplate') templateRef!: TemplateRef<any>;
}

describe('ProgressStepperComponent', () => {
  let component: ProgressStepperComponent;
  let fixture: ComponentFixture<ProgressStepperComponent>;
  let componentRef: ComponentRef<ProgressStepperComponent>;
  let fixtureTest: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressStepperComponent, FontAwesomeModule, TestHostComponent],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faSave);
    library.addIcons(faArrowRight);

    fixtureTest = TestBed.createComponent(TestHostComponent);
    const mockProgressStepperComponent: StepData[] = [
      {
        name: 'panel1 name',
        panelTemplate: fixtureTest.componentInstance.templateRef,
        buttonGroupPrev: [],
        buttonGroupNext: [
          {
            variant: 'filled',
            color: 'secondary',
            icon: 'save',
            onClick() {},
            disabled: false,
            label: 'Save Draft',
          },
          {
            variant: 'filled',
            color: 'primary',
            icon: 'arrow-right',
            onClick() {
              alert('Clicked');
            },
            disabled: false,
            label: 'Next',
            changePanel: true,
          },
        ],
      },
    ];

    fixture = TestBed.createComponent(ProgressStepperComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('steps', mockProgressStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

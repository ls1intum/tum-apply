import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ComponentRef, TemplateRef, ViewChild } from '@angular/core';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faSave } from '@fortawesome/free-solid-svg-icons';

import { ProgressStepperComponent, StepData } from './progress-stepper.component';

@Component({
  template: `
    <ng-template #testTemplate>
      <p>Mock Content</p>
    </ng-template>
    <jhi-progress-stepper />
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
            severity: 'secondary',
            icon: 'save',
            onClick() {},
            disabled: false,
            label: 'Save Draft',
            changePanel: false,
          },
          {
            severity: 'primary',
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
      {
        name: 'panel1 name',
        panelTemplate: fixtureTest.componentInstance.templateRef,
        buttonGroupPrev: [],
        buttonGroupNext: [
          {
            severity: 'secondary',
            icon: 'save',
            onClick() {},
            disabled: false,
            label: 'Sent',
            changePanel: false,
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

  it('should not change panel on button click when changePanel is false', () => {
    expect(component.currentStep()).toBe(1);

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');

    const saveDraftButton = Array.from(buttons).find((btn: HTMLButtonElement) => btn.textContent?.includes('Save Draft'));

    expect(saveDraftButton).toBeTruthy();
    saveDraftButton?.click();
    fixture.detectChanges();

    expect(component.currentStep()).toBe(1);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

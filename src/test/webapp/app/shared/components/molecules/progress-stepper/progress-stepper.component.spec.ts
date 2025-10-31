import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import ButtonGroupComponent from 'app/shared/components/molecules/button-group/button-group.component';
import { TranslateModule } from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';
import { Component, TemplateRef, viewChild } from '@angular/core';

// Test host component with real ng-templates
@Component({
  template: `
    <ng-template #template1>
      <div class="step-1-content">Step 1 Content</div>
    </ng-template>
    <ng-template #template2>
      <div class="step-2-content">Step 2 Content</div>
    </ng-template>
    <ng-template #statusTemplate>
      <div class="status">Status</div>
    </ng-template>

    <jhi-progress-stepper [steps]="steps" [shouldTranslate]="shouldTranslate"> </jhi-progress-stepper>
  `,
  standalone: true,
  imports: [ProgressStepperComponent],
})
class TestHostComponent {
  template1 = viewChild<TemplateRef<any>>('template1');
  template2 = viewChild<TemplateRef<any>>('template2');
  statusTemplate = viewChild<TemplateRef<any>>('statusTemplate');

  shouldTranslate = false;
  steps: StepData[] = [];
}

describe('ProgressStepperComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let component: ProgressStepperComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        StepperModule,
        ButtonGroupComponent,
        TranslateModule.forRoot(),
        SharedModule,
        TestHostComponent,
        ProgressStepperComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;

    hostComponent.steps = [
      {
        name: 'Step 1',
        panelTemplate: hostComponent.template1()!,
        buttonGroupPrev: [],
        buttonGroupNext: [
          {
            changePanel: true,
            onClick: vi.fn(),
            label: 'Next',
            severity: 'primary',
            disabled: false,
          },
        ],
        shouldTranslate: false,
      },
      {
        name: 'Step 2',
        panelTemplate: hostComponent.template2()!,
        buttonGroupPrev: [
          {
            changePanel: true,
            onClick: vi.fn(),
            label: 'Previous',
            severity: 'secondary',
            disabled: false,
          },
        ],
        buttonGroupNext: [
          {
            changePanel: false,
            onClick: vi.fn(),
            label: 'Submit',
            severity: 'primary',
            disabled: false,
          },
        ],
        status: hostComponent.statusTemplate()!,
        shouldTranslate: false,
      },
    ];

    fixture.detectChanges();

    const stepperDebugElement = fixture.debugElement.query(de => de.componentInstance instanceof ProgressStepperComponent);
    component = stepperDebugElement.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(hostComponent).toBeTruthy();
  });

  it('should initialize with step 1', () => {
    expect(component.currentStep()).toBe(1);
  });

  it('should render the correct step content', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.step-1-content')).toBeTruthy();
    expect(compiled.querySelector('.step-1-content')?.textContent).toContain('Step 1 Content');
  });

  it('should navigate to next step', () => {
    component.goToStep(2);
    fixture.detectChanges();

    expect(component.currentStep()).toBe(2);

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.step-2-content')).toBeTruthy();
  });

  it('should navigate to previous step', () => {
    component.goToStep(2);
    fixture.detectChanges();
    expect(component.currentStep()).toBe(2);

    component.goToStep(1);
    fixture.detectChanges();
    expect(component.currentStep()).toBe(1);
  });

  it('should not navigate below step 1', () => {
    component.goToStep(0);
    expect(component.currentStep()).toBe(1);
  });

  it('should not navigate beyond available steps', () => {
    component.goToStep(999);
    expect(component.currentStep()).toBe(1);
  });

  it('should render status template when provided', () => {
    component.goToStep(2);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.status')).toBeTruthy();
  });

  it('should call button onClick and change panel when changePanel is true', () => {
    const nextButton = hostComponent.steps[0].buttonGroupNext[0];
    const onClickSpy = nextButton.onClick as any;

    const buttonGroupData = component.buildButtonGroupData(hostComponent.steps[0].buttonGroupNext, 'next', 1);

    buttonGroupData.buttons[0].onClick();

    expect(onClickSpy).toHaveBeenCalled();
    expect(component.currentStep()).toBe(2);
  });

  it('should call button onClick but not change panel when changePanel is false', () => {
    component.goToStep(2);
    const submitButton = hostComponent.steps[1].buttonGroupNext[0];
    const onClickSpy = submitButton.onClick as any;

    const buttonGroupData = component.buildButtonGroupData(hostComponent.steps[1].buttonGroupNext, 'next', 2);

    buttonGroupData.buttons[0].onClick();

    expect(onClickSpy).toHaveBeenCalled();
    expect(component.currentStep()).toBe(2); // Should stay on step 2
  });

  it('should build button group data correctly', () => {
    const buttonGroupData = component.buildButtonGroupData(hostComponent.steps[0].buttonGroupNext, 'next', 1);

    expect(buttonGroupData.direction).toBe('horizontal');
    expect(buttonGroupData.buttons).toHaveLength(1);
    expect(buttonGroupData.buttons[0].label).toBe('Next');
  });

  it('should navigate to previous step when prev button with changePanel is clicked', () => {
    // First go to step 2
    component.goToStep(2);
    fixture.detectChanges();
    expect(component.currentStep()).toBe(2);

    const prevButton = hostComponent.steps[1].buttonGroupPrev[0];
    const onClickSpy = prevButton.onClick as any;

    const buttonGroupData = component.buildButtonGroupData(hostComponent.steps[1].buttonGroupPrev, 'prev', 2);

    buttonGroupData.buttons[0].onClick();

    expect(onClickSpy).toHaveBeenCalled();
    expect(component.currentStep()).toBe(1); // Should go back to step 1
  });
});

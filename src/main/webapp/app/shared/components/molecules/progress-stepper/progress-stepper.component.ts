import { Component, Signal, TemplateRef, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';

import { Button } from '../../atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../button-group/button-group.component';

/**
 * Represents a button used in the stepper, extending the base Button type.
 * Optionally includes a flag to indicate whether the panel should change.
 */
export type StepButton = Button & {
  changePanel: boolean;
};

export type StepData = {
  name: string;
  panelTemplate: TemplateRef<any>;
  buttonGroupPrev: StepButton[];
  buttonGroupNext: StepButton[];
};

@Component({
  selector: 'jhi-progress-stepper',
  imports: [CommonModule, StepperModule, ButtonGroupComponent],
  templateUrl: './progress-stepper.component.html',
  styleUrl: './progress-stepper.component.scss',
  standalone: true,
})
export class ProgressStepperComponent {
  currentStep = signal<number>(1);
  steps = input<StepData[]>([]);

  buttonGroupPrev: Signal<ButtonGroupData> = computed(() =>
    this.buildButtonGroupData(this.steps()[this.currentStep() - 1].buttonGroupPrev, 'prev', this.currentStep()),
  );

  buttonGroupNext: Signal<ButtonGroupData> = computed(() =>
    this.buildButtonGroupData(this.steps()[this.currentStep() - 1].buttonGroupNext, 'next', this.currentStep()),
  );

  goToStep(index: number): void {
    if (index > 0 && index <= this.steps().length) {
      this.currentStep.set(index);
    }
  }

  buildButtonGroupData(steps: StepButton[], action: 'prev' | 'next', index: number): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: steps.map(button => {
        return {
          ...button,
          onClick: () => {
            button.onClick();
            if (button.changePanel) {
              if (action === 'next') {
                this.goToStep(index + 1);
              } else {
                this.goToStep(index - 1);
              }
            }
          },
        };
      }),
    };
  }
}

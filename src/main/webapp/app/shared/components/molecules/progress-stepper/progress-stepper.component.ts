import { Component, TemplateRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';

import { Button } from '../../atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../button-group/button-group.component';

/**
 * Represents a button used in the stepper, extending the base Button type.
 * Optionally includes a flag to indicate whether the panel should change.
 */
export type StepButton = Button & {
  changePanel?: boolean;
};

/**
 * Describes the data structure for a step in the stepper.
 */
export type StepData = {
  /** Name of the step */
  name: string;
  /** Template for the content panel of the step */
  panelTemplate: TemplateRef<any>;
  /** Buttons shown on the left in the "prev" button group */
  buttonGroupPrev: StepButton[];
  /** Buttons shown on the right in the "next" button group */
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
  /** Index of the currently active step */
  currentStep = 1;

  /** Input list of step data to render in the stepper */
  steps = input<StepData[]>([]);

  /**
   * Navigates to the specified step index if within bounds.
   *
   * @param index - Index of the step to navigate to
   */
  goToStep(index: number) {
    if (index >= 0 && index < this.steps().length) {
      this.currentStep = index;
    }
  }

  /**
   * Generates the button group data for a given step's button group.
   * Each button's click handler is extended to navigate to the appropriate step.
   *
   * @param steps - Array of buttons for the step
   * @param action - Indicates the navigation direction ('prev' or 'next')
   * @param index - Current step index
   * @returns Button group data object for rendering
   */
  getDataFromStepperButtonGroup(steps: StepButton[], action: 'prev' | 'next', index: number): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: steps.map(button => {
        return {
          ...button,
          onClick: () => {
            button.onClick();
            action === 'next' ? this.goToStep(index + 1) : this.goToStep(index - 1);
          },
        };
      }),
    };
  }
}

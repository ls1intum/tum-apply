import { Component, input, TemplateRef } from '@angular/core';
import { Button } from '../../atoms/button/button.component';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import ButtonGroupComponent, { ButtonGroupData } from '../button-group/button-group.component';

export type StepButton = Button & {
  changePanel?: boolean;
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
  currentStep = 1;

  steps = input<StepData[]>([]);

  goToStep(index: number) {
    if (index >= 0 && index < this.steps().length) {
      this.currentStep = index;
      console.log(`set index ${index}`);
    } else {
      console.log(`could not set index ${index} ${this.steps().length}`);
    }
  }

  getDataFromStepperButtonGroup(steps: StepButton[], action: 'prev' | 'next', index: number): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: steps.map(button => {
        return {
          ...button,
          onClick: () => {
            console.log(action + ' index ' + index);
            button.onClick();
            action === 'next' ? this.goToStep(index + 1) : this.goToStep(index - 1);
          },
        };
      }),
    };
  }
}

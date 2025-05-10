import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';

@Component({
  selector: 'jhi-stepper-playground',
  imports: [CommonModule, ProgressStepperComponent],
  templateUrl: './stepper-playground.component.html',
  styleUrl: './stepper-playground.component.scss',
  standalone: true,
})
export class StepperPlaygroundComponent implements OnInit {
  @ViewChild('panel1', { static: true }) panel1!: TemplateRef<any>;
  @ViewChild('panel2', { static: true }) panel2!: TemplateRef<any>;
  @ViewChild('panel3', { static: true }) panel3!: TemplateRef<any>;

  data: StepData[] = [];

  ngOnInit(): void {
    this.data = [
      {
        name: 'panel1 name',
        panelTemplate: this.panel1,
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
      {
        name: 'panel2 name',
        panelTemplate: this.panel2,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            color: 'primary',
            icon: 'arrow-left',
            onClick() {
              alert('Clicked');
            },
            disabled: false,
            label: 'Prev',
            changePanel: true,
          },
        ],
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
      {
        name: 'panel3 name',
        panelTemplate: this.panel3,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            color: 'primary',
            icon: 'arrow-left',
            onClick() {
              alert('Clicked');
            },
            disabled: false,
            label: 'Prev',
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            variant: 'filled',
            color: 'primary',
            icon: 'paper-plane',
            onClick() {
              alert('Clicked');
            },
            disabled: false,
            label: 'Send',
          },
        ],
      },
    ];
  }
}

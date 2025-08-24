import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { ToastService } from 'app/service/toast-service';

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

  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.data = [
      {
        name: 'panel1 name',
        panelTemplate: this.panel1,
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
            onClick: () => {
              this.toastService.showInfo({ detail: 'Clicked' });
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
            severity: 'primary',
            icon: 'arrow-left',
            onClick: () => {
              this.toastService.showInfo({ detail: 'Clicked' });
            },
            disabled: false,
            label: 'Prev',
            changePanel: true,
          },
        ],
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
            onClick: () => {
              this.toastService.showInfo({ detail: 'Clicked' });
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
            severity: 'primary',
            icon: 'arrow-left',
            onClick: () => {
              this.toastService.showInfo({ detail: 'Clicked' });
            },
            disabled: false,
            label: 'Prev',
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'paper-plane',
            onClick: () => {
              this.toastService.showInfo({ detail: 'Clicked' });
            },
            disabled: false,
            label: 'Send',
            changePanel: false,
          },
        ],
      },
    ];
  }
}

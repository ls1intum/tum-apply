import { Component, inject } from '@angular/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ToastComponent } from 'app/shared/toast/toast.component';
import { ToastService } from 'app/service/toast-service';

import ButtonGroupComponent, { ButtonGroupData } from '../../shared/components/molecules/button-group/button-group.component';

@Component({
  selector: 'jhi-button-play-ground',
  imports: [ButtonComponent, ButtonGroupComponent, ToastComponent],
  templateUrl: './button-play-ground.component.html',
  styleUrl: './button-play-ground.component.scss',
  standalone: true,
})
export class ButtonPlayGroundComponent {
  buttonGroupVertical: ButtonGroupData = {
    direction: 'vertical',
    buttons: [
      {
        severity: 'primary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Label',
        onClick: () => this.toastService.showInfo({ detail: 'Tadaaaa' }),
      },
      {
        severity: 'secondary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Secondary',
        onClick: () => this.toastService.showInfo({ detail: 'I am secondary. Click the first button' }),
      },
      {
        severity: 'secondary',
        variant: undefined,
        disabled: false,
        label: 'Secondary',
        onClick: () => this.toastService.showInfo({ detail: 'I am secondary. Click the first button' }),
      },
    ],
  };
  buttonGroupHorizontal: ButtonGroupData = {
    direction: 'horizontal',
    buttons: [
      {
        severity: 'primary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Label',
        onClick: () => this.toastService.showInfo({ detail: 'Tadaaaa' }),
      },
      {
        severity: 'secondary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Secondary',
        onClick: () => this.toastService.showInfo({ detail: 'I am secondary. Click the first button' }),
      },
      {
        severity: 'secondary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Secondary',
        onClick: () => this.toastService.showInfo({ detail: 'I am secondary. Click the first button' }),
      },
    ],
  };

  private toastService = inject(ToastService);
}

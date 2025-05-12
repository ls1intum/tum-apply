import { Component } from '@angular/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import ButtonGroupComponent, { ButtonGroupData } from '../../../shared/components/molecules/button-group/button-group.component';

@Component({
  selector: 'jhi-button-play-ground',
  imports: [ButtonComponent, ButtonGroupComponent],
  templateUrl: './button-play-ground.component.html',
  styleUrl: './button-play-ground.component.scss',
  standalone: true,
})
export class ButtonPlayGroundComponent {
  buttonGroupVertical: ButtonGroupData = {
    direction: 'vertical',
    buttons: [
      {
        color: 'primary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Label',
        onClick: () => alert('Tadaaaa'),
      },
      {
        color: 'secondary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Secondary',
        onClick: () => alert('I am secondary. Click the first button'),
      },
      {
        color: 'secondary',
        variant: undefined,
        disabled: false,
        label: 'Secondary',
        onClick: () => alert('I am secondary. Click the first button'),
      },
    ],
  };
  buttonGroupHorizontal: ButtonGroupData = {
    direction: 'horizontal',
    buttons: [
      {
        color: 'primary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Label',
        onClick: () => alert('Tadaaaa'),
      },
      {
        color: 'secondary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Secondary',
        onClick: () => alert('I am secondary. Click the first button'),
      },
      {
        color: 'secondary',
        variant: undefined,
        icon: 'home',
        disabled: false,
        label: 'Secondary',
        onClick: () => alert('I am secondary. Click the first button'),
      },
    ],
  };
}

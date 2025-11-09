import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

import { Login } from '../../organisms/login/login';
import { Registration } from '../../organisms/registration/registration';
import { AuthOrchestratorService } from '../../../../core/auth/auth-orchestrator.service';
import {ButtonGroupData} from 'app/shared/components/molecules/button-group/button-group.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import ButtonGroupComponent from 'app/shared/components/molecules/button-group/button-group.component';


@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [CommonModule, DividerModule, Login, Registration, ButtonGroupComponent, ButtonComponent],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
})
export class AuthCardComponent {
  readonly authOrchestrator = inject(AuthOrchestratorService);

  buttonGroupData: ButtonGroupData = {
    direction: 'horizontal',
    fullWidth: false,
    buttons: [
      {
        icon: 'xmark',
        variant: 'text',
        severity: 'secondary',
        label: undefined,
        disabled: false,
        onClick: () => { this.onClose(); },
      },
    ],
  };

  onClose(): void {
    this.authOrchestrator.close?.();
  }
}

import { Component, Signal, inject, input } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from '../../atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { AuthTabService } from '../../../../core/auth/auth-tab.service';
import { AccountService } from '../../../../core/auth/account.service';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [ButtonComponent, ButtonGroupComponent, CommonModule, TabsModule, RouterModule],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
})
export class AuthCardComponent {
  mode = input<'login' | 'register'>('login');
  authTabService = inject(AuthTabService);
  value: Signal<number> = this.authTabService.getSelectedTab();
  accountService = inject(AccountService);

  onTabChange(newValue: string | number): void {
    this.authTabService.setSelectedTab(Number(newValue));
  }

  studentButtons(): ButtonGroupData {
    return {
      direction: 'vertical',
      buttons: [
        {
          label: this.mode() === 'register' ? 'Register with Microsoft' : 'Sign in with Microsoft',
          icon: 'microsoft',
          severity: 'secondary',
          disabled: true,
          onClick() {},
        },
        {
          label: this.mode() === 'register' ? 'Register with Apple' : 'Sign in with Apple',
          icon: 'apple',
          severity: 'secondary',
          disabled: true,
          onClick() {},
        },
        {
          label: this.mode() === 'register' ? 'Register with Google' : 'Sign in with Google',
          icon: 'google',
          severity: 'secondary',
          disabled: true,
          onClick() {},
        },
      ],
    };
  }

  onTUMSSOLogin(): void {
    void this.accountService.signIn();
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/pages/usermanagement/login/login.service';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';
import { DropdownComponent } from '../../../shared/components/atoms/dropdown/dropdown.component';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, RouterModule, ButtonComponent, DatePickerComponent, DropdownComponent],
})
export default class HomeComponent implements OnInit {
  account = signal<Account | null>(null);

  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => this.account.set(account));
  }

  login(): void {
    this.loginService.login();
  }
}

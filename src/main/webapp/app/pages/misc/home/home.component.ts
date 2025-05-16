import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/pages/usermanagement/login/login.service';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';
import { DropdownComponent } from '../../../shared/components/atoms/dropdown/dropdown.component';
import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, RouterModule, ButtonComponent, DatePickerComponent, DropdownComponent, StringInputComponent],
})
export default class HomeComponent implements OnInit {
  account = signal<Account | null>(null);

  // Datepicker:
  selectedDate: LocalDate | null = null;
  // Dropdown:
  selectedLocation1: any;
  selectedLocation2: any;

  testInput = '';
  testInputDisabled = '';

  locations = [
    { name: 'Munich Campus', value: 'munich', icon: 'chevron-up' },
    { name: 'Garching Campus', value: 'garching', icon: 'chevron-down' },
    { name: 'Weihenstephan Campus', value: 'weihenstephan', icon: 'map-marker-alt' },
  ];
  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => this.account.set(account));
  }

  login(): void {
    this.loginService.login();
  }
}

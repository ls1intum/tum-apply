import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/atoms/dropdown/dropdown.component';
import { keycloakService } from '../../../core/auth/keycloak.service';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, RouterModule, ButtonComponent, DatePickerComponent, DropdownComponent],
})
export default class HomeComponent implements OnInit {
  account = signal<Account | null>(null);

  // Datepicker:
  selectedDate: string | undefined = undefined;
  // Dropdown:
  selectedLocation1: DropdownOption | undefined = undefined;
  selectedLocation2: DropdownOption | undefined = undefined;
  locations = [
    { name: 'Munich Campus', value: 'munich', icon: 'chevron-up' },
    { name: 'Garching Campus', value: 'garching', icon: 'chevron-down' },
    { name: 'Weihenstephan Campus', value: 'weihenstephan', icon: 'map-marker-alt' },
  ];
  private readonly accountService = inject(AccountService);

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => this.account.set(account));
  }

  login(): void {
    keycloakService.login();
  }
}

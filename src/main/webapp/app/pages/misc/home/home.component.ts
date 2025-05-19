import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/pages/usermanagement/login/login.service';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/atoms/dropdown/dropdown.component';
import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { NumberInputComponent } from '../../../shared/components/atoms/number-input/number-input.component';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    SharedModule,
    RouterModule,
    ButtonComponent,
    DatePickerComponent,
    DropdownComponent,
    StringInputComponent,
    NumberInputComponent,
  ],
})
export default class HomeComponent implements OnInit {
  account = signal<Account | null>(null);

  form: FormGroup = new FormGroup({});

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

  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => this.account.set(account));

    this.form = this.fb.group({
      experience: [null, [Validators.required, Validators.min(0), Validators.max(50)]],
      name: ['', [Validators.required]],
    });
  }

  login(): void {
    this.loginService.login();
  }

  goToJobCreation(): void {
    this.router.navigate(['/job-creation']);
  }
}

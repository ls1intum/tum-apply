import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormGroup } from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/pages/usermanagement/login/login.service';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { FormControl, Validators } from '@angular/forms';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { NumberInputComponent } from '../../../shared/components/atoms/number-input/number-input.component';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, RouterModule, ButtonComponent, StringInputComponent, NumberInputComponent],
})
export default class HomeComponent implements OnInit {
  account = signal<Account | null>(null);

  // Datepicker:
  selectedDate: string | undefined = undefined;

  form: FormGroup = new FormGroup({
    exampleStringTop: new FormControl('', [Validators.required]),
    exampleStringLeft: new FormControl('', [Validators.required, Validators.minLength(3)]),
    exampleNumberTop: new FormControl(null, [Validators.required, Validators.min(1)]),
    exampleNumberLeft: new FormControl(null, [Validators.required, Validators.max(100)]),
  });

  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => this.account.set(account));
  }

  login(): void {
    this.loginService.login();
  }

  goToJobCreation(): void {
    this.router.navigate(['/job-creation']);
  }
}

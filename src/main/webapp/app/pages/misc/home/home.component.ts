import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/pages/usermanagement/login/login.service';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { JobCardComponent } from '../../job/job-overview/job-card/job-card.component';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, ButtonComponent, JobCardComponent],
})
export default class HomeComponent implements OnInit {
  readonly router = inject(Router);

  account = signal<Account | null>(null);

  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);

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

import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/pages/usermanagement/login/login.service';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ApplicationResourceService } from 'app/generated/api/applicationResource.service';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, ButtonComponent],
})
export default class HomeComponent implements OnInit {
  readonly router = inject(Router);

  account = signal<Account | null>(null);

  application_exists = signal<boolean>(true);

  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);
  private readonly applicationService = inject(ApplicationResourceService);

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => this.account.set(account));
    const application_exists = this.application_exists;
    this.applicationService.getApplicationById('bce85235-25b7-46c2-988c-9290be79dc57').subscribe({
      next() {
        application_exists.set(true);
      },
      error(err) {
        console.error(err);
        application_exists.set(false);
      },
    });
  }

  login(): void {
    this.loginService.login();
  }

  goToJobCreation(): void {
    this.router.navigate(['/job-creation']);
  }
}

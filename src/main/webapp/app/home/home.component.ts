import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { CommonModule } from '@angular/common';

import { JobCardComponent } from '../job/job-overview/job-card/job-card.component';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [CommonModule, SharedModule, ButtonComponent, JobCardComponent],
})
export default class HomeComponent {
  readonly router = inject(Router);

  goToJobCreation(): void {
    this.router.navigate(['/job-creation']);
  }
}

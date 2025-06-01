import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [CommonModule, SharedModule, ButtonComponent],
})
export default class HomeComponent {
  readonly router = inject(Router);

  goToJobCreation(): void {
    this.router.navigate(['/job-creation']);
  }

  goToJobsOverview(): void {
    this.router.navigate(['/job-overview']);
  }
}

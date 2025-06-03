import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [CommonModule, SharedModule],
})
export default class HomeComponent {
  readonly router = inject(Router);
}

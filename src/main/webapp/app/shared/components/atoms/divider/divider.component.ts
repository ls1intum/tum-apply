import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'jhi-divider',
  imports: [CommonModule, DividerModule],
  templateUrl: './divider.component.html',
  styleUrl: './divider.component.scss',
})
export class DividerComponent {
  label = input<string | undefined>(undefined);
  layout = input<'vertical' | 'horizontal'>('horizontal');
}

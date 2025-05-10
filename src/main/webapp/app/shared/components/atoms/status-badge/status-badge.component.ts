import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'jhi-status-badge',
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input() status!: 'ACCEPTED' | 'REJECTED' | 'IN_REVIEW' | 'SENT' | 'SAVED' | 'WITHDRAWN';

  get statusClass(): string {
    switch (this.status) {
      case 'ACCEPTED':
        return 'accepted';
      case 'REJECTED':
        return 'rejected';
      case 'IN_REVIEW':
        return 'in-review';
      case 'SENT':
        return 'unopened';
      default:
        throw new Error(`Unknown status: ${this.status}`);
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'jhi-detail-card',
  imports: [CommonModule, CardModule],
  templateUrl: './detail-card.html',
  styleUrl: './detail-card.scss',
})
export class DetailCard {
  @Input() title!: string;
  @Input() content?: string;
  @Input() icon?: string;
  @Input() showCard = true;
}

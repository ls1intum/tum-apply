import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-detail-card',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './detail-card.html',
  styleUrl: './detail-card.scss',
})
export class DetailCard {
  @Input() title!: string;
  @Input() showCard = true;
  @Input() icon?: string;
}

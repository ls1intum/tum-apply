import { Component, model } from '@angular/core';

import { RatingComponent } from '../../shared/components/atoms/rating/rating.component';

@Component({
  selector: 'jhi-rating-playground',
  imports: [RatingComponent],
  templateUrl: './rating-playground.html',
  styleUrl: './rating-playground.scss',
})
export class RatingPlayground {
  rating1 = model<number | undefined>(undefined);
}

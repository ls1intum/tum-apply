import { Component } from '@angular/core';

import { ApplicationCarouselComponent } from '../../shared/components/organisms/application-carousel/application-carousel.component';

@Component({
  selector: 'jhi-application-detail',
  imports: [ApplicationCarouselComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {}

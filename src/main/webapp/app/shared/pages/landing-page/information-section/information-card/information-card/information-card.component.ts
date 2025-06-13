import { Component, input } from '@angular/core';

@Component({
  selector: 'jhi-information-card',
  imports: [],
  templateUrl: './information-card.component.html',
  styleUrl: './information-card.component.scss',
})
export class InformationCardComponent {
  imageSrc = input<string>('');
  text = input<string>('');
  link = input<string>('');
}

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'jhi-voice-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-card.component.html',
})
export class VoiceCardComponent {
  name = input<string>('');
  field = input<string>('');
  quote = input<string>('');
  imageSrc = input<string>('');
}

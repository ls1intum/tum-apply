import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VoiceCardComponent } from './voice-card/voice-card/voice-card.component';

@Component({
  selector: 'jhi-voices-section',
  standalone: true,
  imports: [CommonModule, VoiceCardComponent],
  templateUrl: './voices-section.component.html',
  styleUrl: './voices-section.component.scss',
})
export class VoicesSectionComponent {
  voices = [
    {
      name: 'Aline Vogt',
      field: 'Mathematics',
      quote: 'TUM offers a unique opportunity for research.',
      imageSrc: '/content/images/landing-page/voices-section/aline-vogt.png',
    },
    {
      name: 'Lukas Müller',
      field: 'Informatics',
      quote: 'I appreciate the support and network at TUM.',
      imageSrc: '/content/images/landing-page/voices-section/lukas-mueller.png',
    },
    {
      name: 'Dr. Sofia Klein',
      field: 'Biomedical Engineering',
      quote: 'The diversity at TUM is inspiring.',
      imageSrc: '/content/images/landing-page/voices-section/sofia-klein.png',
    },
    {
      name: 'Max Richter',
      field: 'Chemistry',
      quote: 'TUM is a leader in innovation and research.',
      imageSrc: '/content/images/landing-page/voices-section/max-richter.png',
    },
    {
      name: 'Emily Wagner',
      field: 'Computer Vision',
      quote: 'I feel welcomed and supported here.',
      imageSrc: '/content/images/landing-page/voices-section/emily-wagner.png',
    },
  ];
}

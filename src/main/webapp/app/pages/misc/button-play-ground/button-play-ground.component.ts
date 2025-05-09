import { Component } from '@angular/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-button-play-ground',
  imports: [ButtonComponent],
  templateUrl: './button-play-ground.component.html',
  styleUrl: './button-play-ground.component.scss',
  standalone: true,
})
export class ButtonPlayGroundComponent {}

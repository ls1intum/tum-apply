import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-upload-button',
  imports: [FontAwesomeModule],
  templateUrl: './upload-button.component.html',
  styleUrl: './upload-button.component.scss',
  standalone: true,
})
export class UploadButtonComponent {
  uploadText = input<string>('Please upload');
}

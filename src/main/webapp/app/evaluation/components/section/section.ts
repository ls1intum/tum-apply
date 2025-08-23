import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-section',
  imports: [TranslateModule],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section {
  title = input.required<string>();
}

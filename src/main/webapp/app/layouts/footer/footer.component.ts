import { Component } from '@angular/core';
import { TranslateDirective } from 'app/shared/language';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jhi-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  imports: [TranslateDirective, TranslateModule],
})
export default class FooterComponent {
  constructor(private translateService: TranslateService) {}
}

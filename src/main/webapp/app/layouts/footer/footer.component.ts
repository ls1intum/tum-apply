import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
  constructor(
    private translateService: TranslateService,
    private router: Router,
  ) {}

  navigateToImprint(): void {
    void this.router.navigate(['/imprint']);
  }

  navigateToPrivacy(): void {
    void this.router.navigate(['/privacy']);
  }
}

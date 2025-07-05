import { Component } from '@angular/core';
import { Router } from '@angular/router';
import TranslateDirective from '../../shared/language/translate.directive';

@Component({
  selector: 'jhi-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  imports: [TranslateDirective],
})
export default class FooterComponent {
  constructor(private router: Router) {}

  navigateToImprint(): void {
    void this.router.navigate(['/imprint']);
  }

  navigateToPrivacy(): void {
    void this.router.navigate(['/privacy']);
  }
}

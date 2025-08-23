import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'jhi-prose',
  imports: [],
  templateUrl: './prose.html',
  styleUrl: './prose.scss',
})
export class Prose {
  text = input<string | undefined>(undefined);

  safeHtml = computed<SafeHtml>(() => {
    const raw = this.text();
    return raw !== undefined ? this.sanitizer.bypassSecurityTrustHtml(raw) : '—';
  });

  private sanitizer = inject(DomSanitizer);
}

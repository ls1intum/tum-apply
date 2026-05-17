import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/**
 * Adds button- or link-like keyboard activation to non-semantic elements.
 *
 * Use only when semantic HTML (a real `<button>` or `<a>`) is not possible — for example
 * when the element must contain another interactive element (a checkbox, link, or button),
 * which the HTML spec forbids inside `<button>` and `<a>`.
 *
 * Sets `role` and `tabindex` on the host element, and forwards Enter (always)
 * and Space (when behaving as a button) to a native click on the host.
 *
 * @example
 * ```html
 * <div jhiClickable (click)="select(item)">
 *   <jhi-checkbox [model]="item.selected" />
 *   <span>{{ item.name }}</span>
 * </div>
 * ```
 */
@Directive({
  selector: '[jhiClickable]',
  standalone: true,
  host: {
    '[attr.role]': 'role()',
    '[attr.tabindex]': 'tabIndex()',
  },
})
export class ClickableDirective {
  readonly role = input<'button' | 'link'>('button');
  readonly tabIndex = input<number>(0);

  private readonly el = inject(ElementRef<HTMLElement>);

  @HostListener('keydown.enter', ['$event'])
  onEnter(event: Event): void {
    event.preventDefault();
    (this.el.nativeElement as HTMLElement).click();
  }

  @HostListener('keydown.space', ['$event'])
  onSpace(event: Event): void {
    if (this.role() !== 'button') {
      return;
    }
    event.preventDefault();
    (this.el.nativeElement as HTMLElement).click();
  }
}

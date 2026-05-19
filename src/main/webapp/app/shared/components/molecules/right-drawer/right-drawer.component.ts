import { Component, input, model } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';

/**
 * Right-side modal drawer used for mobile burger menus and similar slide-in panels.
 * Wraps PrimeNG's {@code p-drawer} with the project's defaults (right position, modal,
 * dismissible) and exposes {@link close} so callers can release the modal scroll lock
 * <em>before</em> kicking off any action that visually replaces the current page.
 */
@Component({
  selector: 'jhi-right-drawer',
  standalone: true,
  imports: [DrawerModule],
  templateUrl: './right-drawer.component.html',
})
export class RightDrawerComponent {
  open = model.required<boolean>();
  styleClass = input<string>('!w-72 max-w-[85vw]');
  showCloseIcon = input<boolean>(true);
  dismissible = input<boolean>(true);

  /**
   * Closes the drawer if it is open. Call this <em>before</em> navigating or
   * triggering any action that replaces the current page; PrimeNG's modal drawer
   * locks {@code body} scroll while open and only releases it after its exit
   * animation, so a navigation kicked off while the drawer is still open leaves
   * the next page unscrollable for the duration of the animation.
   */
  close(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }
}

import { Directive, TemplateRef, ViewContainerRef, computed, effect, inject, input } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';

/**
 * @whatItDoes Conditionally includes an HTML element if current user has any
 * of the authorities passed as the `expression`.
 *
 * @howToUse
 * ```
 *     <some-element *jhiHasAnyAuthority="'ROLE_ADMIN'">...</some-element>
 *
 *     <some-element *jhiHasAnyAuthority="['ROLE_ADMIN', 'ROLE_USER']">...</some-element>
 * ```
 */
@Directive({
  selector: '[jhiHasAnyAuthority]',
  standalone: true,
})
export default class HasAnyAuthorityDirective {
  public roles = input<string | string[]>([], { alias: 'jhiHasAnyAuthority' });

  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainerRef = inject(ViewContainerRef);

  private embeddedViewCreated = false;

  constructor() {
    const accountService = inject(AccountService);
    const currentAccount = accountService.trackCurrentAccount();

    const hasPermission = computed(() => {
      const user = currentAccount();
      const roles = this.roles();
      return !!user?.roles && !!roles.length && accountService.hasAnyAuthority(roles);
    });

    effect(() => {
      if (hasPermission()) {
        if (!this.embeddedViewCreated) {
          this.viewContainerRef.createEmbeddedView(this.templateRef);
          this.embeddedViewCreated = true;
        }
      } else {
        this.viewContainerRef.clear();
        this.embeddedViewCreated = false;
      }
    });
  }
}

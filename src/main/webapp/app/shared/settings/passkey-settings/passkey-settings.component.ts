import { Component, computed, inject, signal } from '@angular/core';
import { ToastService } from 'app/service/toast-service';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { KeycloakAuthenticationService } from 'app/core/auth/keycloak-authentication.service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import TranslateDirective from 'app/shared/language/translate.directive';
import { PasskeyCredentialSummary } from 'app/core/auth/models/auth.model';

interface PasskeySettingsItem {
  id: string;
  label: string;
  createdAtLabel?: string;
  removeDisabled: boolean;
  removing: boolean;
}

@Component({
  selector: 'jhi-passkey-settings',
  standalone: true,
  imports: [ButtonComponent, ConfirmDialog, TranslateDirective],
  templateUrl: './passkey-settings.component.html',
})
export class PasskeySettingsComponent {
  readonly passkeys = signal<PasskeyCredentialSummary[]>([]);
  readonly loaded = signal(false);
  readonly loadFailed = signal(false);
  readonly creating = signal(false);
  readonly removingId = signal<string | undefined>(undefined);
  readonly canManagePasskeys = signal(false);

  readonly passkeyItems = computed<PasskeySettingsItem[]>(() => {
    const removingId = this.removingId();
    return this.passkeys().map((passkey, index) => ({
      id: passkey.id,
      label: this.getPasskeyLabel(passkey, index),
      createdAtLabel: this.getCreatedAtLabel(passkey),
      removeDisabled: removingId !== undefined && removingId !== passkey.id,
      removing: removingId === passkey.id,
    }));
  });
  readonly hasPasskeys = computed(() => this.passkeyItems().length > 0);

  private readonly authFacade = inject(AuthFacadeService);
  private readonly keycloakAuthenticationService = inject(KeycloakAuthenticationService);
  private readonly toastService = inject(ToastService);
  private readonly dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  constructor() {
    this.canManagePasskeys.set(this.keycloakAuthenticationService.canManagePasskeys());
    void this.loadPasskeys();
  }

  async createPasskey(): Promise<void> {
    if (this.creating() || !this.canManagePasskeys()) {
      return;
    }

    this.creating.set(true);
    try {
      await this.authFacade.registerPasskey();
      await this.loadPasskeys();
    } finally {
      this.creating.set(false);
    }
  }

  async removePasskey(id: string): Promise<void> {
    if (this.removingId() !== undefined || !this.canManagePasskeys()) {
      return;
    }

    this.removingId.set(id);
    try {
      await this.keycloakAuthenticationService.removePasskey(id);
      this.passkeys.update(passkeys => passkeys.filter(passkey => passkey.id !== id));
      this.toastService.showSuccessKey('settings.passkeys.removed');
    } catch {
      this.toastService.showErrorKey('settings.passkeys.removeFailed');
    } finally {
      this.removingId.set(undefined);
    }
  }

  private getPasskeyLabel(passkey: PasskeyCredentialSummary, index: number): string {
    const label = passkey.label?.trim();
    if (label !== undefined && label !== '') {
      return label;
    }
    return `Passkey ${index + 1}`;
  }

  private getCreatedAtLabel(passkey: PasskeyCredentialSummary): string | undefined {
    if (passkey.createdDate === undefined) {
      return undefined;
    }

    try {
      return this.dateFormatter.format(passkey.createdDate);
    } catch {
      return undefined;
    }
  }

  private async loadPasskeys(): Promise<void> {
    if (!this.canManagePasskeys()) {
      this.passkeys.set([]);
      this.loadFailed.set(false);
      this.loaded.set(true);
      return;
    }

    this.loadFailed.set(false);
    try {
      this.passkeys.set(await this.keycloakAuthenticationService.listPasskeys());
    } catch {
      this.passkeys.set([]);
      this.loadFailed.set(true);
      this.toastService.showErrorKey('settings.passkeys.loadFailed');
    } finally {
      this.loaded.set(true);
    }
  }
}

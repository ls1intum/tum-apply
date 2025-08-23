import { EffectRef, Injectable, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { type AuthFlowMode, AuthOrchestratorService } from '../data-access/auth-orchestrator.service';
import { AuthCardComponent } from '../../components/templates/auth-card/auth-card.component';

export interface OpenAuthOptions {
  mode?: AuthFlowMode;
  prefill?: { email?: string; firstName?: string; lastName?: string };
  onSuccess?: () => void;
}

@Injectable({ providedIn: 'root' })
export class AuthDialogService {
  private readonly dialog = inject(DialogService);
  private readonly orchestrator = inject(AuthOrchestratorService);
  private ref: DynamicDialogRef | null = null;
  private onCloseEffect?: EffectRef;
  private onDestroyEffect?: EffectRef;

  constructor() {
    // Close PrimeNG dialog whenever orchestrator reports it is closed
    effect(() => {
      const isOpen = this.orchestrator.isOpen();
      if (!isOpen && this.ref) {
        try {
          this.ref.close();
        } finally {
          this.ref = null;
        }
      }
    });
  }

  open(opts?: OpenAuthOptions): void {
    // Clean up any existing effects before opening new dialog
    if (this.onCloseEffect) {
      this.onCloseEffect.destroy();
      this.onCloseEffect = undefined;
    }
    if (this.onDestroyEffect) {
      this.onDestroyEffect.destroy();
      this.onDestroyEffect = undefined;
    }

    // Close any existing instance to avoid duplicates
    this.ref?.close();

    // Initialize orchestrator state (this stores opts.onSuccess intern)
    this.orchestrator.open(opts);

    // Open new dialog
    this.ref = this.dialog.open(AuthCardComponent, {
      style: { border: 'none', overflow: 'auto', background: 'transparent', boxShadow: 'none' },
      contentStyle: { padding: '0' },
      modal: true,
      dismissableMask: true,
      closeOnEscape: true,
      showHeader: false,
    });

    const onCloseSig = toSignal(this.ref.onClose, { initialValue: null });
    const onDestroySig = toSignal(this.ref.onDestroy, { initialValue: null });

    this.onCloseEffect = effect(() => {
      if (onCloseSig() !== null) {
        this.ref = null;
        this.orchestrator.close();
      }
    });

    this.onDestroyEffect = effect(() => {
      if (onDestroySig() !== null) {
        this.onCloseEffect?.destroy();
        this.onCloseEffect = undefined;
      }
    });
  }

  close(): void {
    try {
      this.ref?.close();
    } finally {
      this.ref = null;
      this.orchestrator.close();
      if (this.onCloseEffect) {
        this.onCloseEffect.destroy();
        this.onCloseEffect = undefined;
      }
      if (this.onDestroyEffect) {
        this.onDestroyEffect.destroy();
        this.onDestroyEffect = undefined;
      }
    }
  }
}

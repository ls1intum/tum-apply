import { EffectRef, Injectable, Injector, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { AuthOrchestratorService } from '../data-access/auth-orchestrator.service';
import { AuthCardComponent } from '../../components/templates/auth-card/auth-card.component';
import { AuthOpenOptions } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthDialogService {
  private readonly injector = inject(Injector);
  private readonly dialogService = inject(DialogService);
  private readonly orchestrator = inject(AuthOrchestratorService);
  private ref: DynamicDialogRef | null = null;
  private onCloseEffect?: EffectRef;
  private onDestroyEffect?: EffectRef;
  private onOrchestratorEffect?: EffectRef;

  open(opts?: AuthOpenOptions): void {
    // Ensure any previous dialog/effects are cleaned up before opening a new one
    if (this.ref) {
      try {
        this.ref.close();
      } finally {
        this.ref = null;
      }
    }
    this.destroyEffects();

    // Initialize orchestrator state (this stores opts.onSuccess intern)
    this.orchestrator.open(opts);

    // Open new dialog
    this.ref = this.dialogService.open(AuthCardComponent, {
      style: { border: 'none', overflow: 'auto', background: 'transparent', boxShadow: 'none', minWidth: '25rem' },
      contentStyle: { padding: '0' },
      modal: true,
      dismissableMask: true,
      closeOnEscape: true,
      showHeader: false,
    });

    this.onOrchestratorEffect = effect(
      () => {
        const isOpen = this.orchestrator.isOpen();
        if (!isOpen && this.ref) {
          try {
            this.ref.close();
          } finally {
            this.ref = null;
          }
        }
      },
      { injector: this.injector },
    );

    const onCloseSig = toSignal(this.ref.onClose, { injector: this.injector, initialValue: null });
    const onDestroySig = toSignal(this.ref.onDestroy, { injector: this.injector, initialValue: null });

    this.onCloseEffect = effect(
      () => {
        if (onCloseSig() !== null) {
          this.ref = null;
          this.orchestrator.close();
        }
      },
      { injector: this.injector },
    );

    this.onDestroyEffect = effect(
      () => {
        if (onDestroySig() !== null) {
          this.onCloseEffect?.destroy();
          this.onCloseEffect = undefined;
        }
      },
      { injector: this.injector },
    );
  }

  close(): void {
    try {
      this.ref?.close();
    } finally {
      this.ref = null;
      this.orchestrator.close();
      this.destroyEffects();
    }
  }

  private destroyEffects(): void {
    // Clean up any existing effects
    if (this.onCloseEffect) {
      this.onCloseEffect.destroy();
      this.onCloseEffect = undefined;
    }
    if (this.onDestroyEffect) {
      this.onDestroyEffect.destroy();
      this.onDestroyEffect = undefined;
    }
    if (this.onOrchestratorEffect) {
      this.onOrchestratorEffect.destroy();
      this.onOrchestratorEffect = undefined;
    }
  }
}

import { EffectRef, Injectable, Injector, effect, inject } from '@angular/core';
import { Observable } from 'rxjs';
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
  private ref:
    | (Omit<DynamicDialogRef, 'onClose' | 'onDestroy'> & {
        onClose: Observable<unknown>;
        onDestroy: Observable<unknown>;
      })
    | null = null;
  private onRefEventsEffect?: EffectRef;
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

    const onCloseSig = toSignal<unknown>(this.ref.onClose, { injector: this.injector, initialValue: null });
    const onDestroySig = toSignal<unknown>(this.ref.onDestroy, { injector: this.injector, initialValue: null });

    this.onRefEventsEffect = effect(
      () => {
        const closed = onCloseSig();
        const destroyed = onDestroySig();
        if ((closed !== null || destroyed !== null) && this.ref) {
          try {
            this.ref.close();
          } finally {
            this.ref = null;
            this.orchestrator.close();
          }
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
    if (this.onRefEventsEffect) {
      this.onRefEventsEffect.destroy();
      this.onRefEventsEffect = undefined;
    }
    if (this.onOrchestratorEffect) {
      this.onOrchestratorEffect.destroy();
      this.onOrchestratorEffect = undefined;
    }
  }
}

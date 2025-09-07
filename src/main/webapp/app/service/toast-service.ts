import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, createComponent, inject } from '@angular/core';
import { ToastComponent } from 'app/shared/toast/toast.component';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

type ToastSeverity = 'success' | 'info' | 'warn' | 'error';
type ToastMessageInput = {
  summary?: string;
  detail?: string;
  life?: number;
};

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private messageService = inject(MessageService);
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private translate = inject(TranslateService);
  private toastComponent: ComponentRef<ToastComponent> | undefined = undefined;

  constructor() {
    this.createGlobalToast();
  }

  showSuccess(message: ToastMessageInput): void {
    this.show(message, 'success');
  }

  showError(message: ToastMessageInput): void {
    this.show(message, 'error');
  }

  showInfo(message: ToastMessageInput): void {
    this.show(message, 'info');
  }

  showWarn(message: ToastMessageInput): void {
    this.show(message, 'warn');
  }

  /** Key-based toast helpers for application messages (expects base key with .summary/.detail present) */
  showSuccessKey(baseKey: string, params?: Record<string, any>): void {
    this.showByBaseKey(baseKey, 'success', params);
  }
  showErrorKey(baseKey: string, params?: Record<string, any>): void {
    this.showByBaseKey(baseKey, 'error', params);
  }
  showInfoKey(baseKey: string, params?: Record<string, any>): void {
    this.showByBaseKey(baseKey, 'info', params);
  }
  showWarnKey(baseKey: string, params?: Record<string, any>): void {
    this.showByBaseKey(baseKey, 'warn', params);
  }

  private showByBaseKey(baseKey: string, severity: ToastSeverity, params?: Record<string, any>): void {
    const summary = this.translateKey(`${baseKey}.summary`, params);
    const detail = this.translateKey(`${baseKey}.detail`, params);
    this.show({ summary, detail }, severity);
  }

  private translateKey(key: string, params?: Record<string, any>): string {
    return this.translate.instant(key, params);
  }

  private show(message: ToastMessageInput, severity: ToastSeverity): void {
    this.messageService.add({ severity, ...message });
  }

  private createGlobalToast(): void {
    if (!this.toastComponent) {
      this.toastComponent = createComponent(ToastComponent, {
        environmentInjector: this.injector,
      });

      document.body.appendChild(this.toastComponent.location.nativeElement);
      this.appRef.attachView(this.toastComponent.hostView);
    }
  }
}

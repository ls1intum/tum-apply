import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, createComponent, inject } from '@angular/core';
import { ToastComponent } from 'app/shared/toast/toast.component';
import { MessageService } from 'primeng/api';

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

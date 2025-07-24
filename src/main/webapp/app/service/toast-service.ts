import { Injectable } from '@angular/core';
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
  constructor(private messageService: MessageService) {}

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
}

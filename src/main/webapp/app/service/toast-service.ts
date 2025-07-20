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

  private show(message: ToastMessageInput, severity: ToastSeverity) {
    this.messageService.add({ severity, ...message });
  }

  showSuccess(message: ToastMessageInput) {
    this.show(message, 'success');
  }

  showError(message: ToastMessageInput) {
    this.show(message, 'error');
  }

  showInfo(message: ToastMessageInput) {
    this.show(message, 'info');
  }

  showWarn(message: ToastMessageInput) {
    this.show(message, 'warn');
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AiFeatureStatus {
  aiEnabled: boolean;
  manuallyDisabled: boolean;
  circuitBreakerOpen: boolean;
}

/**
 * Service that tracks the system-wide AI feature availability.
 *
 * Fetches the status from {@code /api/ai/feature-toggle/status} on initialization
 * and exposes reactive signals so components can hide or disable AI features
 * when the system-wide kill switch is active or the circuit breaker has tripped.
 *
 * Call {@link refresh} to re-check after a 503 response.
 */
@Injectable({
  providedIn: 'root',
})
export class AiFeatureStatusService {
  /** Whether AI is available system-wide (manual toggle ON and circuit breaker closed). */
  readonly aiSystemEnabled = signal<boolean>(true);

  /** Whether an admin has manually disabled AI. */
  readonly manuallyDisabled = signal<boolean>(false);

  /** Whether the circuit breaker tripped due to consecutive LLM failures. */
  readonly circuitBreakerOpen = signal<boolean>(false);

  /** Whether the initial status check has completed. */
  readonly loaded = signal<boolean>(false);

  private http = inject(HttpClient);

  constructor() {
    void this.refresh();
  }

  /**
   * Fetches the current AI feature status from the backend.
   * Components can call this after receiving a 503 to update UI state.
   */
  async refresh(): Promise<void> {
    try {
      const status = await firstValueFrom(this.http.get<AiFeatureStatus>('/api/ai/feature-toggle/status'));
      this.aiSystemEnabled.set(status.aiEnabled);
      this.manuallyDisabled.set(status.manuallyDisabled);
      this.circuitBreakerOpen.set(status.circuitBreakerOpen);
    } catch {
      // If we can't reach the endpoint, assume AI is unavailable
      this.aiSystemEnabled.set(false);
    } finally {
      this.loaded.set(true);
    }
  }

  /**
   * Marks AI as unavailable locally (called when a 503 is received from an AI endpoint).
   * Also triggers a refresh to get the full status from the server.
   */
  markUnavailable(): void {
    this.aiSystemEnabled.set(false);
    void this.refresh();
  }
}

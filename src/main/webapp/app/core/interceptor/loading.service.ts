import { Injectable, computed, signal } from '@angular/core';

/**
 * Service to globally track ongoing HTTP requests.
 * Used by the LoadingInterceptor to display a global loading indicator
 * for requests that take longer than a certain threshold.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  /**
   * Computed signal that returns true if there is at least one active request.
   */
  readonly isLoading = computed(() => this.activeRequests() > 0);

  private readonly activeRequests = signal(0);

  /**
   * Increments the count of active HTTP requests.
   */
  show(): void {
    this.activeRequests.update(n => n + 1);
  }

  /**
   * Decrements the count of active HTTP requests.
   * Ensures the count never drops below 0.
   */
  hide(): void {
    this.activeRequests.update(n => Math.max(0, n - 1));
  }
}

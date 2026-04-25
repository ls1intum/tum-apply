import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';
import { ToggleSwitchComponent } from 'app/shared/components/atoms/toggle-switch/toggle-switch.component';
import { ProgressSpinnerComponent } from 'app/shared/components/atoms/progress-spinner/progress-spinner.component';
import { ToastService } from 'app/service/toast-service';
import { AiFeatureToggleResourceApi } from 'app/generated/api/ai-feature-toggle-resource-api';
import { AiFeatureStatusDTO } from 'app/generated/model/ai-feature-status-dto';

/**
 * Admin page for system-wide settings.
 * Currently provides controls for the AI feature kill switch (manual toggle and circuit breaker reset).
 */
@Component({
    selector: 'jhi-admin-system-settings',
    standalone: true,
    imports: [TranslateDirective, TranslatePipe, ButtonComponent, InfoBoxComponent, TagComponent, ToggleSwitchComponent, ProgressSpinnerComponent],
    templateUrl: './admin-system-settings.component.html',
})
export class AdminSystemSettingsComponent {
    /** Whether the initial status is being loaded. */
    readonly isLoading = signal(false);

    /** Whether a toggle or reset action is in progress. */
    readonly isUpdating = signal(false);

    /** Current AI feature status from the backend. */
    readonly aiStatus = signal<AiFeatureStatusDTO | undefined>(undefined);

    /** Whether the AI toggle is currently enabled (derived from status). */
    readonly aiEnabled = computed(() => this.aiStatus()?.aiEnabled ?? true);

    /** Whether the circuit breaker is currently open (derived from status). */
    readonly circuitBreakerOpen = computed(() => this.aiStatus()?.circuitBreakerOpen ?? false);

    /** Whether AI was manually disabled by an admin (derived from status). */
    readonly manuallyDisabled = computed(() => this.aiStatus()?.manuallyDisabled ?? false);

    private readonly aiFeatureToggleApi = inject(AiFeatureToggleResourceApi);
    private readonly toastService = inject(ToastService);

    constructor() {
        void this.loadStatus();
    }

    /** Fetches the current AI feature status from the backend. */
    async loadStatus(): Promise<void> {
        this.isLoading.set(true);
        try {
            const status = await firstValueFrom(this.aiFeatureToggleApi.getAiStatus());
            this.aiStatus.set(status);
        } catch {
            this.toastService.showErrorKey('systemSettings.ai.toast.loadError');
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Toggles the AI feature on or off.
     *
     * @param enabled whether AI features should be enabled
     */
    async onAiToggleChanged(enabled: boolean): Promise<void> {
        this.isUpdating.set(true);
        try {
            const status = await firstValueFrom(this.aiFeatureToggleApi.toggleAi(enabled));
            this.aiStatus.set(status);
            if (enabled) {
                this.toastService.showSuccessKey('systemSettings.ai.toast.enabled');
            } else {
                this.toastService.showSuccessKey('systemSettings.ai.toast.disabled');
            }
        } catch {
            this.toastService.showErrorKey('systemSettings.ai.toast.toggleError');
        } finally {
            this.isUpdating.set(false);
        }
    }

    /** Resets the circuit breaker so AI requests are allowed again. */
    async resetCircuitBreaker(): Promise<void> {
        this.isUpdating.set(true);
        try {
            const status = await firstValueFrom(this.aiFeatureToggleApi.resetCircuitBreaker());
            this.aiStatus.set(status);
            this.toastService.showSuccessKey('systemSettings.ai.toast.circuitBreakerReset');
        } catch {
            this.toastService.showErrorKey('systemSettings.ai.toast.resetError');
        } finally {
            this.isUpdating.set(false);
        }
    }
}

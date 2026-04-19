import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, firstValueFrom, shareReplay } from 'rxjs';
import { AiResourceApi } from 'app/generated/api/ai-resource-api';
import { UserResourceApi } from 'app/generated/api/user-resource-api';
import { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';
import { ExtractedApplicationDataDTO } from 'app/generated/model/extracted-application-data-dto';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { ToastService } from 'app/service/toast-service';
import { AiConsentModalComponent } from 'app/shared/settings/ai-consent-settings/ai-consent-modal/ai-consent-modal.component';

import { ButtonComponent } from '../../atoms/button/button.component';
import { ProgressSpinnerComponent } from '../../atoms/progress-spinner/progress-spinner.component';
import TranslateDirective from '../../../language/translate.directive';

const activeExtractions = new Map<string, Observable<ExtractedApplicationDataDTO>>();

@Component({
  selector: 'jhi-ai-extraction-box',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, ProgressSpinnerComponent, AiConsentModalComponent, TranslateDirective],
  templateUrl: './ai-extraction-box.component.html',
})
export class AiExtractionBoxComponent {
  /** translation key for helper text shown at the top */
  helperTextKey = input<string>('');

  /** application ID for the extraction API call */
  applicationId = input<string | undefined>();

  /** document holders to extract from (persisted documents with real IDs) */
  documentIds = input<DocumentInformationHolderDTO[]>([]);

  /** queued files from deferred uploads (not yet persisted) */
  queuedFiles = input<File[]>([]);

  /** whether the documents are CVs */
  isCv = input<boolean>(false);

  /** whether to persist extracted data on the server */
  saveData = input<boolean>(true);

  /** emitted with extracted data on successful extraction */
  extracted = output<ExtractedApplicationDataDTO>();

  /** whether AI features are enabled (loaded from user consent) */
  aiFeaturesEnabled = signal<boolean>(false);

  /** whether an extraction is currently running */
  isExtractingAi = signal<boolean>(false);

  /** controls consent modal visibility */
  aiConsentVisible = signal<boolean>(false);

  /**
   * Whether the extract button should be disabled.
   *
   * @return true when there are no persisted documents and no queued files to extract from
   */
  disabled = computed(() => {
    const hasPersistedDocs = this.documentIds().some(d => d.id && !d.id.startsWith('temp-'));
    const hasQueuedFiles = this.queuedFiles().length > 0;
    return !hasPersistedDocs && !hasQueuedFiles;
  });

  protected readonly UserShortDTORolesEnum = UserShortDTORolesEnum;

  private aiApi = inject(AiResourceApi);
  private userApi = inject(UserResourceApi);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  // Restores spinner and re-subscribes if an extraction is still in flight from before navigation
  private restoreExtractionState = effect(() => {
    const key = this.extractionKey();
    if (!key) return;

    const active$ = activeExtractions.get(key);
    if (active$) {
      this.isExtractingAi.set(true);
      this.subscribeToExtraction(active$, key);
    }
  });

  constructor() {
    void this.loadAiConsent();
  }
  /**
   * Triggers AI data extraction from the available documents.
   */
  extractAiData(): void {
    // 1) Build the extraction key and collect persisted document IDs and queued files
    const key = this.extractionKey();
    const appId = this.applicationId();

    if (!key || !appId) return;

    const persistedDocIds = this.documentIds()
      .map(d => d.id)
      .filter(id => id && !id.startsWith('temp-'));
    const queued = this.queuedFiles();

    if (persistedDocIds.length === 0 && queued.length === 0) return;

    this.isExtractingAi.set(true);

    // 2) If an extraction for this key is already in flight, reuse its observable; otherwise start a new one
    let extraction$ = activeExtractions.get(key);
    if (!extraction$) {
      extraction$ = this.aiApi
        .extractPdfData(appId, persistedDocIds, this.isCv(), this.saveData(), queued)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      activeExtractions.set(key, extraction$);
    }

    // 3) Subscribe to the extraction result and emit it on completion
    this.subscribeToExtraction(extraction$, key);
  }

  /**
   * Builds a unique cache key for the current extraction context.
   *
   * @return a key combining the application ID and document type, or undefined if no application ID is set
   */
  private extractionKey(): string | undefined {
    const appId = this.applicationId();
    if (!appId) return undefined;
    return `${appId}_${this.isCv()}`;
  }

  /**
   * Subscribes to an in-flight extraction observable and handles the result.
   * On success the extracted data is emitted and the cache entry is removed.
   * On error a toast is shown and the cache entry is cleaned up.
   *
   * @param extraction$ - the shared extraction observable to subscribe to
   * @param key - the cache key used to remove the entry from activeExtractions on completion
   */
  private subscribeToExtraction(extraction$: Observable<ExtractedApplicationDataDTO>, key: string): void {
    extraction$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: extractedData => {
        this.extracted.emit(extractedData);
        activeExtractions.delete(key);
        this.isExtractingAi.set(false);
      },
      error: () => {
        this.toastService.showErrorKey('entity.aiExtraction.aiExtractionFailed');
        activeExtractions.delete(key);
        this.isExtractingAi.set(false);
      },
    });
  }

  /**
   * Loads the user's AI consent setting from the server and updates the aiFeaturesEnabled signal.
   * Shows an error toast if the request fails.
   */
  private async loadAiConsent(): Promise<void> {
    try {
      const isEnabled = await firstValueFrom(this.userApi.getAiConsent());
      this.aiFeaturesEnabled.set(isEnabled);
    } catch {
      this.toastService.showErrorKey('settings.aiFeatures.loadFailed');
    }
  }
}

/**
 * Sets a patch field only if the corresponding form control is currently empty.
 * Exported so consumers (pages) can reuse the same logic when applying AI-extracted values.
 *
 * @param form - the reactive form group containing the control
 * @param patch - the patch object to add the value to
 * @param formKey - the key of the form control to check and patch
 * @param value - the extracted value to set; ignored if undefined
 */
export function setIfEmpty(form: FormGroup, patch: Record<string, string>, formKey: string, value: string | undefined): void {
  if (value !== undefined && (form.get(formKey)?.value as string) === '') {
    patch[formKey] = value;
  }
}

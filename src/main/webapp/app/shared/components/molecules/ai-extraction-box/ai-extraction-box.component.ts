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
import { ButtonComponent } from '../../atoms/button/button.component';
import { ProgressSpinnerComponent } from '../../atoms/progress-spinner/progress-spinner.component';
import { AiConsentModalComponent } from 'app/shared/settings/ai-consent-settings/ai-consent-modal/ai-consent-modal.component';

// Holds in-flight extraction observables across component re-creation (e.g. page navigation).
// Keyed by `${applicationId}_${isCv}` so CV and certificate extractions don't collide.
const activeExtractions = new Map<string, Observable<ExtractedApplicationDataDTO>>();

@Component({
  selector: 'jhi-ai-extraction-box',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, ProgressSpinnerComponent, AiConsentModalComponent],
  templateUrl: './ai-extraction-box.component.html',
})
export class AiExtractionBoxComponent {
  /** translation key for helper text shown at the top */
  helperTextKey = input<string>('');

  /** translation key for consent sentence shown next to the info button */
  consentTextKey = input<string>('');

  /** label translation key for the action button */
  buttonLabelKey = input<string>('entity.applicationPage1.aiExtractionButton');

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

  constructor() {
    void this.loadAiConsent();
  }

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

  extractAiData(): void {
    const key = this.extractionKey();
    const appId = this.applicationId();

    if (!key || !appId) return;

    const persistedDocIds = this.documentIds()
      .map(d => d.id)
      .filter(id => id && !id.startsWith('temp-'));
    const queued = this.queuedFiles();

    if (persistedDocIds.length === 0 && queued.length === 0) return;

    this.isExtractingAi.set(true);

    let extraction$ = activeExtractions.get(key);
    if (!extraction$) {
      if (queued.length > 0) {
        // Use file upload endpoint for queued (deferred) files
        extraction$ = this.aiApi
          .extractPdfDataFromFiles(queued, this.isCv(), this.saveData(), appId)
          .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      } else {
        // Use document ID endpoint for persisted documents
        extraction$ = this.aiApi
          .extractPdfData(appId, persistedDocIds, this.isCv(), this.saveData())
          .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      }
      activeExtractions.set(key, extraction$);
    }

    this.subscribeToExtraction(extraction$, key);
  }

  private extractionKey(): string | undefined {
    const appId = this.applicationId();
    if (!appId) return undefined;
    return `${appId}_${this.isCv()}`;
  }

  private subscribeToExtraction(extraction$: Observable<ExtractedApplicationDataDTO>, key: string): void {
    extraction$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: extractedData => {
        this.extracted.emit(extractedData);
        activeExtractions.delete(key);
        this.isExtractingAi.set(false);
      },
      error: () => {
        this.toastService.showErrorKey('entity.applicationPage1.aiExtractionFailed');
        activeExtractions.delete(key);
        this.isExtractingAi.set(false);
      },
    });
  }

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
 * Helper: set a patch field if the corresponding form control is empty.
 * Exported so consumers (pages) can reuse the same logic when applying AI-extracted values.
 */
export function setIfEmpty(form: FormGroup, patch: Record<string, string>, formKey: string, value: string | undefined): void {
  if (value !== undefined && (form.get(formKey)?.value as string) === '') {
    patch[formKey] = value;
  }
}


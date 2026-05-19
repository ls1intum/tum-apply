import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ReferenceLetterUploadResourceApi } from 'app/generated/api/reference-letter-upload-resource-api';
import { ReferenceLetterUploadContextDTO } from 'app/generated/model/reference-letter-upload-context-dto';
import {
  DocumentInformationHolderDTO,
  DocumentInformationHolderDTODocumentTypeEnum,
} from 'app/generated/model/document-information-holder-dto';
import { ReferenceRequestDTOStatusEnum } from 'app/generated/model/reference-request-dto';

/**
 * Public landing page for external referees to upload a recommendation letter.
 */
@Component({
  selector: 'jhi-reference-letter-upload',
  standalone: true,
  imports: [FontAwesomeModule, TranslateDirective, ButtonComponent, UploadButtonComponent],
  templateUrl: './reference-letter-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceLetterUploadComponent {
  protected readonly documentType = DocumentInformationHolderDTODocumentTypeEnum.ReferenceLetter;
  protected readonly loading = signal<boolean>(true);
  protected readonly uploading = signal<boolean>(false);
  protected readonly errorKey = signal<string | undefined>(undefined);
  protected readonly justUploaded = signal<boolean>(false);

  protected readonly context = signal<ReferenceLetterUploadContextDTO | undefined>(undefined);
  protected uploadedDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  protected readonly queuedFile = signal<File | undefined>(undefined);
  protected readonly hasQueuedFile = computed(() => !!this.queuedFile());

  protected readonly expired = computed(() => this.context()?.status === ReferenceRequestDTOStatusEnum.Expired);

  protected readonly applicantFullName = computed(() => {
    const ctx = this.context();
    if (!ctx) {
      return '';
    }
    return [ctx.applicantFirstName, ctx.applicantLastName].filter(part => !!part).join(' ');
  });

  protected readonly alreadySubmitted = computed(
    () => this.context()?.status === ReferenceRequestDTOStatusEnum.Submitted || this.justUploaded(),
  );

  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ReferenceLetterUploadResourceApi);
  private readonly toastService = inject(ToastService);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  constructor() {
    void this.loadContext();
  }

  /**
   * Captures the file the referee picked.
   *
   * @param files the queued file list emitted by the upload button
   */
  protected onQueuedFilesChanged(files: File[]): void {
    this.queuedFile.set(files[0]);
  }

  /**
   * Sends the staged file to the upload endpoint and switches to the success view.
   * Stays on the upload view on failure so the referee can retry.
   */
  protected async confirmUpload(): Promise<void> {
    const file = this.queuedFile();
    if (!file) {
      return;
    }
    this.uploading.set(true);
    try {
      await firstValueFrom(this.api.upload(this.token, file));
      this.justUploaded.set(true);
      this.toastService.showSuccessKey(`reference.uploadSuccess`);
    } catch {
      this.toastService.showErrorKey(`reference.uploadFailed`);
    } finally {
      this.uploading.set(false);
    }
  }

  /**
   * Loads the prefill context for the token from the server and stores it in the {@code context}
   * signal. Network or token-not-found failures populate {@code errorKey} so the template can
   * render an explanatory message instead of a blank page.
   */
  private async loadContext(): Promise<void> {
    if (!this.token) {
      this.errorKey.set(`reference.error.invalidLink`);
      this.loading.set(false);
      return;
    }
    try {
      const context = await firstValueFrom(this.api.getContext(this.token));
      this.context.set(context);
    } catch {
      this.errorKey.set(`reference.error.invalidLink`);
    } finally {
      this.loading.set(false);
    }
  }
}

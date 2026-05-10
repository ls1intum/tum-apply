import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { firstValueFrom } from 'rxjs';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ReferenceLetterUploadResourceApi } from 'app/generated/api/reference-letter-upload-resource-api';
import { ReferenceLetterContextDTO } from 'app/generated/model/reference-letter-context-dto';
import { ReferenceRequestDTOStatusEnum } from 'app/generated/model/reference-request-dto';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const TOAST_PREFIX = 'reference.letterUpload';

/**
 * Public landing page rendered at {@code /reference/:token} for external referees to upload a
 * recommendation letter. The token in the URL is the only authentication; the page resolves the
 * prefilled context server-side, accepts a single PDF (≤5 MB) and swaps to a green-checkmark
 * confirmation panel after a successful upload.
 */
@Component({
  selector: 'jhi-reference-letter-upload',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateModule, TranslateDirective, FileUploadModule],
  templateUrl: './reference-letter-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceLetterUploadComponent {
  protected readonly maxUploadMb = MAX_UPLOAD_BYTES / 1024 / 1024;

  protected readonly loading = signal<boolean>(true);
  protected readonly uploading = signal<boolean>(false);
  protected readonly context = signal<ReferenceLetterContextDTO | undefined>(undefined);
  protected readonly errorKey = signal<string | undefined>(undefined);
  protected readonly justUploaded = signal<boolean>(false);

  protected readonly refereeFullName = computed(() => {
    const ctx = this.context();
    if (!ctx) {
      return '';
    }
    return [ctx.refereeTitle, ctx.refereeFirstName, ctx.refereeLastName].filter(part => !!part).join(' ');
  });

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

  protected readonly expired = computed(() => this.context()?.status === ReferenceRequestDTOStatusEnum.Expired);

  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ReferenceLetterUploadResourceApi);
  private readonly toastService = inject(ToastService);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  constructor() {
    void this.loadContext();
  }

  /**
   * Handles the {@code (onSelect)} event from the PrimeNG file upload — validates the selected
   * file size client-side then delegates to the backend.
   *
   * @param event the file-select event emitted by {@code p-fileupload}
   */
  protected async onFileSelected(event: FileSelectEvent): Promise<void> {
    const file = event.currentFiles[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      this.toastService.showErrorKey(`${TOAST_PREFIX}.toast.tooLarge`);
      return;
    }
    await this.uploadFile(file);
  }

  /**
   * Loads the prefill context for the token from the server and stores it in the {@code context}
   * signal. Network or token-not-found failures populate {@code errorKey} so the template can
   * render an explanatory message instead of a blank page.
   */
  private async loadContext(): Promise<void> {
    if (!this.token) {
      this.errorKey.set(`${TOAST_PREFIX}.error.invalidLink`);
      this.loading.set(false);
      return;
    }
    try {
      const context = await firstValueFrom(this.api.getContext(this.token));
      this.context.set(context);
    } catch {
      this.errorKey.set(`${TOAST_PREFIX}.error.invalidLink`);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * POSTs the chosen file to the upload endpoint and flips {@code justUploaded} on success so the
   * confirmation panel renders.
   *
   * @param file the PDF to upload
   */
  private async uploadFile(file: File): Promise<void> {
    this.uploading.set(true);
    try {
      await firstValueFrom(this.api.upload(this.token, file));
      this.justUploaded.set(true);
      this.toastService.showSuccessKey(`${TOAST_PREFIX}.toast.uploadSuccess`);
    } catch {
      this.toastService.showErrorKey(`${TOAST_PREFIX}.toast.uploadFailed`);
    } finally {
      this.uploading.set(false);
    }
  }
}

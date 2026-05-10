import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ReferenceLetterUploadResourceApi } from 'app/generated/api/reference-letter-upload-resource-api';
import { ReferenceLetterContextDTO } from 'app/generated/model/reference-letter-context-dto';
import {
  DocumentInformationHolderDTO,
  DocumentInformationHolderDTODocumentTypeEnum,
} from 'app/generated/model/document-information-holder-dto';
import { ReferenceRequestDTOStatusEnum } from 'app/generated/model/reference-request-dto';

const TOAST_PREFIX = 'reference.letterUpload';

/**
 * Public landing page rendered at {@code /reference/:token} for external referees to upload a
 * recommendation letter. The token in the URL is the only authentication; the page resolves the
 * prefilled context server-side, delegates the actual file pick to {@code jhi-upload-button} and
 * swaps to a green-checkmark confirmation panel after a successful upload.
 */
@Component({
  selector: 'jhi-reference-letter-upload',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateModule, TranslateDirective, UploadButtonComponent],
  templateUrl: './reference-letter-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceLetterUploadComponent {
  protected readonly loading = signal<boolean>(true);
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

  protected readonly documentType = DocumentInformationHolderDTODocumentTypeEnum.ReferenceLetter;

  /**
   * Backing list for the upload button's "uploaded document" row.
   */
  protected uploadedDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);

  /**
   * Custom upload handler given to {@code jhi-upload-button}. Bound as an arrow so it captures
   * {@code this} when the button invokes it.
   */
  protected readonly uploadHandler = async (file: File): Promise<DocumentInformationHolderDTO[]> => {
    const created = await firstValueFrom(this.api.upload(this.token, file));
    this.justUploaded.set(true);
    this.toastService.showSuccessKey(`${TOAST_PREFIX}.toast.uploadSuccess`);
    return [
      {
        id: created.referenceRequestId ?? '',
        name: file.name,
        size: file.size,
      },
    ];
  };

  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ReferenceLetterUploadResourceApi);
  private readonly toastService = inject(ToastService);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  constructor() {
    void this.loadContext();
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

}

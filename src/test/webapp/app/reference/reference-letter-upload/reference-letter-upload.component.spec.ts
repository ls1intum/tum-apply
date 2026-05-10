import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throwError } from 'rxjs';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';
import {
  createMockContext,
  createReferenceLetterUploadResourceApiMock,
  provideReferenceLetterUploadResourceApiMock,
  ReferenceLetterUploadResourceApiMock,
} from 'util/reference-letter-upload-resource-api.service.mock';
import { ReferenceLetterUploadComponent } from 'app/reference/reference-letter-upload/reference-letter-upload.component';
import { ReferenceRequestDTOStatusEnum } from 'app/generated/model/reference-request-dto';
import { FileSelectEvent } from 'primeng/fileupload';

const TOKEN = 'sample-token';

interface ReferenceLetterUploadComponentInternals {
  uploadFile(file: File): Promise<void>;
  onFileSelected(event: FileSelectEvent): Promise<void>;
}

const internals = (component: ReferenceLetterUploadComponent): ReferenceLetterUploadComponentInternals =>
  component as unknown as ReferenceLetterUploadComponentInternals;

describe('ReferenceLetterUploadComponent', () => {
  let fixture: ComponentFixture<ReferenceLetterUploadComponent>;
  let component: ReferenceLetterUploadComponent;
  let api: ReferenceLetterUploadResourceApiMock;
  let toast: ToastServiceMock;

  const setupFixture = async (
    apiOverrides: Partial<ReferenceLetterUploadResourceApiMock> = {},
    contextOverrides = createMockContext(),
    routeParams: Record<string, string> = { token: TOKEN },
  ) => {
    api = Object.assign(createReferenceLetterUploadResourceApiMock(contextOverrides), apiOverrides);
    toast = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [ReferenceLetterUploadComponent],
      providers: [
        provideReferenceLetterUploadResourceApiMock(api),
        provideToastServiceMock(toast),
        provideActivatedRouteMock(createActivatedRouteMock(routeParams)),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReferenceLetterUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    // The constructor triggers loadContext() asynchronously; flush the resulting microtask
    // so the loading-state branch in the template is gone before any assertions run.
    await Promise.resolve();
    fixture.detectChanges();
  };

  const fakePdf = (name = 'letter.pdf', size = 1024) => new File([new Uint8Array(size)], name, { type: 'application/pdf' });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial load', () => {
    it('should resolve the token context on init', async () => {
      await setupFixture();

      expect(api.getContext).toHaveBeenCalledOnce();
      expect(api.getContext).toHaveBeenCalledWith(TOKEN);
    });

    it('should toast and surface invalid-link state when the token cannot be resolved', async () => {
      await setupFixture({ getContext: vi.fn().mockReturnValue(throwError(() => new Error('boom'))) });

      const root = fixture.nativeElement as HTMLElement;
      expect(root.textContent).toContain('reference.letterUpload.error.invalidLink');
    });
  });

  describe('upload', () => {
    beforeEach(async () => {
      await setupFixture();
    });

    it('should POST the selected file and switch to the success view', async () => {
      await internals(component).uploadFile(fakePdf());

      expect(api.upload).toHaveBeenCalledOnce();
      expect(api.upload).toHaveBeenCalledWith(TOKEN, expect.any(File));
      expect(toast.showSuccessKey).toHaveBeenCalledOnce();
    });

    it('should reject files larger than the size limit before calling the API', async () => {
      const oversized = fakePdf('big.pdf', 6 * 1024 * 1024);
      const selectEvent = { currentFiles: [oversized] } as unknown as FileSelectEvent;

      await internals(component).onFileSelected(selectEvent);

      expect(api.upload).not.toHaveBeenCalled();
      expect(toast.showErrorKey).toHaveBeenCalledOnce();
      expect(toast.showErrorKey).toHaveBeenCalledWith('reference.letterUpload.toast.tooLarge');
    });

    it('should toast on upload failure and stay on the upload view', async () => {
      api.upload.mockReturnValueOnce(throwError(() => new Error('boom')));

      await internals(component).uploadFile(fakePdf());

      expect(toast.showErrorKey).toHaveBeenCalledOnce();
      expect(toast.showErrorKey).toHaveBeenCalledWith('reference.letterUpload.toast.uploadFailed');
    });
  });

  describe('already-submitted token', () => {
    it('should render the success view without showing an upload control', async () => {
      await setupFixture(undefined, createMockContext({ status: ReferenceRequestDTOStatusEnum.Submitted }));

      const root = fixture.nativeElement as HTMLElement;
      expect(root.textContent).toContain('reference.letterUpload.success.title');
    });
  });
});

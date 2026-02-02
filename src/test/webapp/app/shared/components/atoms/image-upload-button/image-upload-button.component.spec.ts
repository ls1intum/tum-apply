import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import {
  ImageUploadButtonComponent,
  ImageUploadConfig,
  ImageUploadError,
} from 'app/shared/components/atoms/image-upload-button/image-upload-button.component';
import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { ImageDTO } from 'app/generated/model/imageDTO';

import { provideTranslateMock } from '../../../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';
import { createImageResourceApiServiceMock, provideImageResourceApiServiceMock } from '../../../../../util/image-resource-api.service.mock';

// Helper functions
function createMockFile(name: string, type: string, size: number): File {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function createMockFileEvent(file: File): Event {
  const mockInput = document.createElement('input');
  Object.defineProperty(mockInput, 'files', {
    value: [file],
    writable: false,
  });
  return { target: mockInput } as unknown as Event;
}

// Type helper
type ComponentPrivate = {
  getImageDimensions: (file: File) => Promise<{ width: number; height: number }>;
};

function getPrivate(component: ImageUploadButtonComponent): ComponentPrivate {
  return component as unknown as ComponentPrivate;
}

describe('ImageUploadButtonComponent', () => {
  // Test constants
  const VALID_FILE_SIZE = 1024 * 1024; // 1MB
  const LARGE_FILE_SIZE = 6 * 1024 * 1024; // 6MB
  const SMALL_FILE_SIZE = 1024; // 1KB
  const CUSTOM_MAX_FILE_SIZE = 1024 * 1024; // 1MB
  const OVERSIZED_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const DEFAULT_MAX_DIMENSION = 4096;
  const VALID_IMAGE_WIDTH = 1920;
  const VALID_IMAGE_HEIGHT = 1080;
  const OVERSIZED_IMAGE_DIMENSION = 5000;

  let component: ImageUploadButtonComponent;
  let fixture: ComponentFixture<ImageUploadButtonComponent>;
  let mockImageService: ReturnType<typeof createImageResourceApiServiceMock>;

  // Common test files
  let validJpegFile: File;
  let largeJpegFile: File;
  let svgFile: File;

  beforeEach(async () => {
    mockImageService = createImageResourceApiServiceMock();

    await TestBed.configureTestingModule({
      imports: [ImageUploadButtonComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting(), provideImageResourceApiServiceMock(mockImageService)],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploadButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Setup common test files
    validJpegFile = createMockFile('test.jpg', 'image/jpeg', VALID_FILE_SIZE);
    largeJpegFile = createMockFile('large.jpg', 'image/jpeg', LARGE_FILE_SIZE);
    svgFile = createMockFile('test.svg', 'image/svg+xml', SMALL_FILE_SIZE);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default config values', () => {
      expect(component.DEFAULT_MAX_FILE_SIZE).toBe(DEFAULT_MAX_FILE_SIZE);
      expect(component.DEFAULT_MAX_DIMENSION).toBe(DEFAULT_MAX_DIMENSION);
      expect(component.DEFAULT_ACCEPTED_TYPES).toEqual(['image/jpeg', 'image/jpg', 'image/png']);
      expect(component.isUploading()).toBe(false);
    });

    it('should compute accepted image types from config', () => {
      fixture.componentRef.setInput('config', { acceptedTypes: ['image/png', 'image/webp'] });
      fixture.detectChanges();
      expect(component.acceptedImageTypes()).toBe('image/png,image/webp');
    });

    it('should use default accepted types when config is empty', () => {
      fixture.componentRef.setInput('config', {});
      fixture.detectChanges();
      expect(component.acceptedImageTypes()).toBe('image/jpeg,image/jpg,image/png');
    });
  });

  describe('Image Upload Validation', () => {
    beforeEach(() => {
      // Mock getImageDimensions for image upload tests
      vi.spyOn(getPrivate(component), 'getImageDimensions').mockResolvedValue({ width: VALID_IMAGE_WIDTH, height: VALID_IMAGE_HEIGHT });
    });

    it.each([
      {
        name: 'file too large',
        getFile: () => largeJpegFile,
        expectedError: { type: 'fileTooLarge', errorKey: 'imageUpload.error.fileTooLarge' },
        setupSpy: (spy?: ReturnType<typeof vi.spyOn>) => spy && vi.spyOn(console, 'error').mockImplementation(() => {}),
      },
      {
        name: 'invalid file type',
        getFile: () => svgFile,
        expectedError: { type: 'invalidFileType', errorKey: 'imageUpload.error.invalidFileType' },
      },
      {
        name: 'dimensions too large',
        getFile: () => validJpegFile,
        expectedError: { type: 'dimensionsTooLarge', errorKey: 'imageUpload.error.dimensionsTooLarge' },
        setupSpy: () =>
          vi.spyOn(getPrivate(component), 'getImageDimensions').mockResolvedValueOnce({
            width: OVERSIZED_IMAGE_DIMENSION,
            height: OVERSIZED_IMAGE_DIMENSION,
          }),
      },
      {
        name: 'invalid image file',
        getFile: () => validJpegFile,
        expectedError: { type: 'invalidImage', errorKey: 'imageUpload.error.invalidImage' },
        setupSpy: () => vi.spyOn(getPrivate(component), 'getImageDimensions').mockRejectedValueOnce(new Error('Invalid')),
      },
      {
        name: 'upload failure',
        getFile: () => validJpegFile,
        expectedError: { type: 'uploadFailed', errorKey: 'imageUpload.error.uploadFailed' },
        setupSpy: () => mockImageService.uploadJobBanner.mockReturnValueOnce(throwError(() => new Error('Upload failed'))),
      },
    ])('should emit error when $name', async ({ getFile, expectedError, setupSpy }) => {
      const spy = setupSpy?.();
      const mockEvent = createMockFileEvent(getFile());

      let emittedError: ImageUploadError | undefined;
      const subscription = component.uploadError.subscribe(error => {
        emittedError = error;
      });

      await component.onImageSelected(mockEvent);

      expect(emittedError).toEqual(expectedError);
      expect((mockEvent.target as HTMLInputElement).value).toBe('');

      subscription.unsubscribe();
      spy && spy.mockRestore();
    });

    it.each([
      { name: 'no files', event: { target: { files: [] } as unknown as HTMLInputElement } as unknown as Event },
      { name: 'non-input target', event: { target: document.createElement('div') } as unknown as Event },
    ])('should handle $name gracefully', async ({ event }) => {
      await component.onImageSelected(event);
      expect(mockImageService.uploadJobBanner).not.toHaveBeenCalled();
    });
  });

  describe('Successful Image Upload', () => {
    beforeEach(() => {
      vi.spyOn(getPrivate(component), 'getImageDimensions').mockResolvedValue({ width: VALID_IMAGE_WIDTH, height: VALID_IMAGE_HEIGHT });
    });

    it('should upload image successfully using default upload function', async () => {
      const mockEvent = createMockFileEvent(validJpegFile);
      const mockImage: ImageDTO = { imageId: 'uploaded123', url: '/images/uploaded.jpg', imageType: 'JOB_BANNER' };
      mockImageService.uploadJobBanner.mockReturnValueOnce(of(mockImage));

      let emittedImage: ImageDTO | undefined;
      const subscription = component.imageUploaded.subscribe(image => {
        emittedImage = image;
      });

      await component.onImageSelected(mockEvent);

      expect(emittedImage).toEqual(mockImage);
      expect(component.isUploading()).toBe(false);
      expect((mockEvent.target as HTMLInputElement).value).toBe('');

      subscription.unsubscribe();
    });
  });

  describe('Custom Configuration', () => {
    it('should respect custom max file size', async () => {
      const customConfig: ImageUploadConfig = {
        maxFileSizeBytes: CUSTOM_MAX_FILE_SIZE,
      };
      fixture.componentRef.setInput('config', customConfig);
      fixture.detectChanges();

      const largeFile = createMockFile('large.jpg', 'image/jpeg', OVERSIZED_FILE_SIZE);
      const mockEvent = createMockFileEvent(largeFile);

      let emittedError: ImageUploadError | undefined;
      const subscription = component.uploadError.subscribe(error => {
        emittedError = error;
      });

      await component.onImageSelected(mockEvent);

      expect(emittedError?.type).toBe('fileTooLarge');

      subscription.unsubscribe();
    });

    it('should respect custom accepted types', async () => {
      const customConfig: ImageUploadConfig = {
        acceptedTypes: ['image/png'],
      };
      fixture.componentRef.setInput('config', customConfig);
      fixture.detectChanges();

      const jpegFile = createMockFile('test.jpg', 'image/jpeg', SMALL_FILE_SIZE);
      const mockEvent = createMockFileEvent(jpegFile);

      let emittedError: ImageUploadError | undefined;
      const subscription = component.uploadError.subscribe(error => {
        emittedError = error;
      });

      await component.onImageSelected(mockEvent);

      expect(emittedError?.type).toBe('invalidFileType');

      subscription.unsubscribe();
    });
  });
});

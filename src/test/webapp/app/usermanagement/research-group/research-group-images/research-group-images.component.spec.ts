import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ResearchGroupImagesComponent } from 'app/usermanagement/research-group/research-group-images/research-group-images.component';
import { ImageDTO } from 'app/generated/model/imageDTO';
import { ImageUploadError } from 'app/shared/components/atoms/image-upload-button/image-upload-button.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideImageResourceApiServiceMock, createImageResourceApiServiceMock } from 'util/image-resource-api.service.mock';
import { provideActivatedRouteMock, createActivatedRouteMock } from 'util/activated-route.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const createFile = () => new File(['content'], 'banner.png', { type: 'image/png' });

describe('ResearchGroupImagesComponent', () => {
  let component: ResearchGroupImagesComponent;
  let fixture: ComponentFixture<ResearchGroupImagesComponent>;
  let mockImageService: ReturnType<typeof createImageResourceApiServiceMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let routeMock: ReturnType<typeof createActivatedRouteMock>;

  const imageInUse: ImageDTO = { imageId: 'i1', url: '/img/1.png', isInUse: true };
  const imageNotInUse: ImageDTO = { imageId: 'i2', url: '/img/2.png', isInUse: false };

  const createComponent = async () => {
    fixture = TestBed.createComponent(ResearchGroupImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    mockImageService = createImageResourceApiServiceMock();
    mockImageService.getResearchGroupJobBanners.mockReturnValue(of([imageInUse, imageNotInUse]));
    mockImageService.getResearchGroupJobBannersByResearchGroup.mockReturnValue(of([imageNotInUse]));
    mockImageService.uploadJobBanner.mockReturnValue(of(imageNotInUse));
    mockImageService.uploadJobBannerForResearchGroup.mockReturnValue(of(imageInUse));
    mockImageService.deleteImage.mockReturnValue(of({}));

    mockToastService = createToastServiceMock();
    routeMock = createActivatedRouteMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupImagesComponent],
      providers: [
        provideImageResourceApiServiceMock(mockImageService),
        provideToastServiceMock(mockToastService),
        provideActivatedRouteMock(routeMock),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();
  });

  describe('initialization and loading', () => {
    it('should create', async () => {
      await createComponent();
      expect(component).toBeTruthy();
    });

    it('loads current user research group images in default mode', async () => {
      await createComponent();

      expect(component.selectedResearchGroupId()).toBe('');
      expect(mockImageService.getResearchGroupJobBanners).toHaveBeenCalled();
      expect(mockImageService.getResearchGroupJobBannersByResearchGroup).not.toHaveBeenCalled();
      expect(component.allImages()).toEqual([imageInUse, imageNotInUse]);
      expect(component.isLoading()).toBe(false);
    });

    it('loads selected research group images in admin mode from query param', async () => {
      routeMock.setQueryParams({ researchGroupId: 'rg-1' });

      await createComponent();

      expect(component.selectedResearchGroupId()).toBe('rg-1');
      expect(mockImageService.getResearchGroupJobBannersByResearchGroup).toHaveBeenCalledWith('rg-1');
      expect(mockImageService.getResearchGroupJobBanners).not.toHaveBeenCalled();
      expect(component.allImages()).toEqual([imageNotInUse]);
    });

    it('shows error toast when loading images fails', async () => {
      mockImageService.getResearchGroupJobBanners.mockReturnValue(throwError(() => new Error('Error')));

      await createComponent();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.imageLibrary.error.loadFailed');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('computed values', () => {
    it('computes image statistics and usage splits', async () => {
      await createComponent();
      component.allImages.set([imageInUse, imageNotInUse, { imageId: 'i3', url: '/img/3.png' }]);

      expect(component.totalImages()).toBe(3);
      expect(component.inUseCount()).toBe(1);
      expect(component.notInUseCount()).toBe(2);
      expect(component.inUseImages()).toEqual([imageInUse]);
      expect(component.notInUseImages().length).toBe(2);
    });
  });

  describe('uploading', () => {
    it('uses professor upload endpoint in default mode', async () => {
      await createComponent();
      const file = createFile();

      let result: ImageDTO | undefined;
      component.uploadImage(file).subscribe(value => {
        result = value;
      });

      expect(mockImageService.uploadJobBanner).toHaveBeenCalledWith(file);
      expect(mockImageService.uploadJobBannerForResearchGroup).not.toHaveBeenCalled();
      expect(result).toEqual(imageNotInUse);
    });

    it('uses admin upload endpoint in admin mode', async () => {
      routeMock.setQueryParams({ researchGroupId: 'rg-1' });
      await createComponent();
      const file = createFile();

      let result: ImageDTO | undefined;
      component.uploadImage(file).subscribe(value => {
        result = value;
      });

      expect(mockImageService.uploadJobBannerForResearchGroup).toHaveBeenCalledWith('rg-1', file);
      expect(mockImageService.uploadJobBanner).not.toHaveBeenCalled();
      expect(result).toEqual(imageInUse);
    });

    it('adds uploaded image and shows success toast', async () => {
      await createComponent();
      component.allImages.set([imageInUse]);

      component.onImageUploaded(imageNotInUse);

      expect(component.allImages()).toEqual([imageInUse, imageNotInUse]);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.imageLibrary.success.imageUploaded');
    });

    it('shows upload error toast', async () => {
      await createComponent();
      const error: ImageUploadError = { errorKey: 'upload.failed', type: 'uploadFailed' };

      component.onUploadError(error);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('upload.failed');
    });
  });

  describe('deleting', () => {
    it('skips delete when image id is missing', async () => {
      await createComponent();

      await component.deleteImage('');

      expect(mockImageService.deleteImage).not.toHaveBeenCalled();
    });

    it('deletes image and updates list', async () => {
      await createComponent();
      component.allImages.set([imageInUse, imageNotInUse]);

      await component.deleteImage('i1');

      expect(mockImageService.deleteImage).toHaveBeenCalledWith('i1');
      expect(component.allImages()).toEqual([imageNotInUse]);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.imageLibrary.success.imageDeleted');
    });

    it('shows error toast when delete fails', async () => {
      await createComponent();
      mockImageService.deleteImage.mockReturnValue(throwError(() => new Error('Error')));

      await component.deleteImage('i1');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.imageLibrary.error.deleteFailed');
    });
  });
});

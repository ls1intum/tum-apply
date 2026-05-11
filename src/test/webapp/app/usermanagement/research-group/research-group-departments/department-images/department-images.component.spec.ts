import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { DepartmentImages } from 'app/usermanagement/research-group/research-group-departments/department-images/department-images.component';
import { ImageDTO } from 'app/generated/model/image-dto';
import { DepartmentDTO } from 'app/generated/model/department-dto';
import { ImageUploadError } from 'app/shared/components/atoms/image-upload-button/image-upload-button.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideDepartmentResourceApiMock, createDepartmentResourceApiMock } from 'util/department-resource-api.service.mock';
import { provideImageResourceApiMock, createImageResourceApiMock } from 'util/image-resource-api.service.mock';
import { provideActivatedRouteMock, createActivatedRouteMock } from 'util/activated-route.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const createFile = () => new File(['content'], 'banner.png', { type: 'image/png' });

describe('DepartmentImages', () => {
  let component: DepartmentImages;
  let fixture: ComponentFixture<DepartmentImages>;
  let mockImageApi: ReturnType<typeof createImageResourceApiMock>;
  let mockDepartmentApi: ReturnType<typeof createDepartmentResourceApiMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let routeMock: ReturnType<typeof createActivatedRouteMock>;

  const mockDepartments: DepartmentDTO[] = [
    { departmentId: 'd1', name: 'Dept 1' },
    { departmentId: 'd2', name: 'Dept 2' },
  ];

  const imageInUse: ImageDTO = { imageId: 'i1', url: '/img/1.png', isInUse: true };
  const imageNotInUse: ImageDTO = { imageId: 'i2', url: '/img/2.png', isInUse: false };

  const createComponent = async () => {
    fixture = TestBed.createComponent(DepartmentImages);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    mockImageApi = createImageResourceApiMock();
    mockImageApi.getDefaultJobBanners.mockReturnValue(of([]));
    mockImageApi.uploadDefaultJobBanner.mockReturnValue(of(imageNotInUse));
    mockImageApi.deleteImage.mockReturnValue(of({}));

    mockDepartmentApi = createDepartmentResourceApiMock();
    mockDepartmentApi.getDepartments.mockReturnValue(of(mockDepartments));

    mockToastService = createToastServiceMock();
    routeMock = createActivatedRouteMock();

    await TestBed.configureTestingModule({
      imports: [DepartmentImages],
      providers: [
        provideImageResourceApiMock(mockImageApi),
        provideDepartmentResourceApiMock(mockDepartmentApi),
        provideToastServiceMock(mockToastService),
        provideActivatedRouteMock(routeMock),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();
  });

  describe('initialization', () => {
    it('loads departments and applies preselected department', async () => {
      routeMock.setQueryParams({ departmentId: 'd1' });
      mockImageApi.getDefaultJobBanners.mockReturnValue(of([imageInUse]));

      await createComponent();

      expect(component.selectedDepartment()?.value).toBe('d1');
      expect(mockImageApi.getDefaultJobBanners).toHaveBeenCalledWith('d1');
      expect(component.defaultImages()).toEqual([imageInUse]);
    });

    it('shows an error toast when departments fail to load', async () => {
      mockDepartmentApi.getDepartments.mockReturnValue(throwError(() => new Error('Error')));

      await createComponent();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.images.error.loadDepartments');
    });

    it('filters out departments missing name or id in options', async () => {
      await createComponent();

      component.departments.set([
        { departmentId: 'd1', name: undefined },
        { departmentId: undefined, name: 'Dept 2' },
        { departmentId: 'd3', name: 'Dept 3' },
      ]);

      expect(component.departmentOptions()).toEqual([{ name: 'Dept 3', value: 'd3' }]);
    });
  });

  describe('loadDefaultImages', () => {
    it('clears images when no department is selected', async () => {
      await createComponent();
      component.defaultImages.set([imageInUse]);
      component.selectedDepartment.set(undefined);

      await component.loadDefaultImages();

      expect(component.defaultImages()).toEqual([]);
      expect(mockImageApi.getDefaultJobBanners).not.toHaveBeenCalled();
    });

    it('shows an error toast when loading images fails', async () => {
      await createComponent();
      const option = { name: 'Dept 1', value: 'd1' };
      component.selectedDepartment.set(option);
      mockImageApi.getDefaultJobBanners.mockReturnValue(throwError(() => new Error('Error')));

      await component.loadDefaultImages();

      expect(component.defaultImages()).toEqual([]);
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.images.error.loadImages');
    });
  });

  describe('uploading', () => {
    it('blocks upload when no department is selected', async () => {
      await createComponent();
      component.selectedDepartment.set(undefined);
      let completed = false;

      component.uploadDefaultImage(createFile()).subscribe({ complete: () => (completed = true) });

      expect(completed).toBe(true);
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.images.error.noDepartment');
      expect(mockImageApi.uploadDefaultJobBanner).not.toHaveBeenCalled();
    });

    it('uploads a default image for the selected department', async () => {
      await createComponent();
      const file = createFile();
      component.selectedDepartment.set({ name: 'Dept 1', value: 'd1' });

      let received: ImageDTO | undefined;
      component.uploadDefaultImage(file).subscribe(value => {
        received = value;
      });

      expect(mockImageApi.uploadDefaultJobBanner).toHaveBeenCalledWith('d1', file);
      expect(received).toEqual(imageNotInUse);
    });

    it('shows an error toast for upload errors', async () => {
      await createComponent();
      const error: ImageUploadError = { errorKey: 'upload.failed', type: 'uploadFailed' };

      component.onUploadError(error);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('upload.failed');
    });
  });

  describe('deleting', () => {
    it('deletes an image and updates list', async () => {
      await createComponent();
      component.defaultImages.set([imageInUse, imageNotInUse]);

      await component.onDeleteImage('i1');

      expect(mockImageApi.deleteImage).toHaveBeenCalledWith('i1');
      expect(component.defaultImages()).toEqual([imageNotInUse]);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.departments.images.success.imageDeleted');
    });

    it('shows an error toast when delete fails', async () => {
      await createComponent();
      mockImageApi.deleteImage.mockReturnValue(throwError(() => new Error('Error')));

      await component.onDeleteImage('i1');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.images.error.deleteFailed');
    });
  });

  it('splits images by usage and tracks upload availability', async () => {
    await createComponent();
    component.defaultImages.set([imageInUse, imageNotInUse, { imageId: 'i3', url: '/img/3.png' }]);

    expect(component.inUseImages()).toEqual([imageInUse]);
    expect(component.notInUseImages().length).toBe(2);
    expect(component.canUpload()).toBe(false);

    component.selectedDepartment.set({ name: 'Dept 1', value: 'd1' });
    expect(component.canUpload()).toBe(true);
  });
});

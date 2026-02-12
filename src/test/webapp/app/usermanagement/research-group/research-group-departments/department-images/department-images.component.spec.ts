import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { DepartmentImages } from 'app/usermanagement/research-group/research-group-departments/department-images/department-images.component';
import { ImageDTO } from 'app/generated/model/imageDTO';
import { DepartmentDTO } from 'app/generated/model/departmentDTO';
import { ImageUploadError } from 'app/shared/components/atoms/image-upload-button/image-upload-button.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideDepartmentResourceApiServiceMock, createDepartmentResourceApiServiceMock } from 'util/department-resource-api.service.mock';
import { provideImageResourceApiServiceMock, createImageResourceApiServiceMock } from 'util/image-resource-api.service.mock';
import { provideActivatedRouteMock, createActivatedRouteMock } from 'util/activated-route.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const createFile = () => new File(['content'], 'banner.png', { type: 'image/png' });

describe('DepartmentImages', () => {
  let component: DepartmentImages;
  let fixture: ComponentFixture<DepartmentImages>;
  let mockImageService: ReturnType<typeof createImageResourceApiServiceMock>;
  let mockDepartmentService: ReturnType<typeof createDepartmentResourceApiServiceMock>;
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
    mockImageService = createImageResourceApiServiceMock();
    mockImageService.getDefaultJobBanners.mockReturnValue(of([]));
    mockImageService.uploadDefaultJobBanner.mockReturnValue(of(imageNotInUse));
    mockImageService.deleteImage.mockReturnValue(of({}));

    mockDepartmentService = createDepartmentResourceApiServiceMock();
    mockDepartmentService.getDepartments.mockReturnValue(of(mockDepartments));

    mockToastService = createToastServiceMock();
    routeMock = createActivatedRouteMock();

    await TestBed.configureTestingModule({
      imports: [DepartmentImages],
      providers: [
        provideImageResourceApiServiceMock(mockImageService),
        provideDepartmentResourceApiServiceMock(mockDepartmentService),
        provideToastServiceMock(mockToastService),
        provideActivatedRouteMock(routeMock),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();
  });

  describe('initialization', () => {
    it('should create', async () => {
      await createComponent();
      expect(component).toBeTruthy();
    });

    it('loads departments and applies preselected department', async () => {
      routeMock.setQueryParams({ departmentId: 'd1' });
      mockImageService.getDefaultJobBanners.mockReturnValue(of([imageInUse]));

      await createComponent();

      expect(component.selectedDepartment()?.value).toBe('d1');
      expect(mockImageService.getDefaultJobBanners).toHaveBeenCalledWith('d1');
      expect(component.defaultImages()).toEqual([imageInUse]);
    });

    it('does not apply preselected department when no match is found', async () => {
      routeMock.setQueryParams({ departmentId: 'missing' });

      await createComponent();

      expect(component.selectedDepartmentId()).toBe('');
      expect(mockImageService.getDefaultJobBanners).not.toHaveBeenCalled();
    });

    it('shows an error toast when departments fail to load', async () => {
      mockDepartmentService.getDepartments.mockReturnValue(throwError(() => new Error('Error')));

      await createComponent();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.images.error.loadDepartments');
    });

    it('does not override a selected department when applying preselection', async () => {
      routeMock.setQueryParams({ departmentId: 'd1' });
      await createComponent();

      const option = { name: 'Dept 2', value: 'd2' };
      component.selectedDepartment.set(option);
      mockImageService.getDefaultJobBanners.mockClear();

      const applyPreselected = (component as unknown as { applyPreselectedDepartment: () => void }).applyPreselectedDepartment;
      applyPreselected.call(component);

      expect(component.selectedDepartment()).toBe(option);
      expect(mockImageService.getDefaultJobBanners).not.toHaveBeenCalled();
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

  describe('department selection', () => {
    it('updates selection and loads images on department change', async () => {
      await createComponent();

      const option = { name: 'Dept 1', value: 'd1' };
      const loadSpy = vi.spyOn(component, 'loadDefaultImages').mockResolvedValue();

      component.onDepartmentChange(option);

      expect(component.selectedDepartment()).toEqual(option);
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('loadDefaultImages', () => {
    it('clears images when no department is selected', async () => {
      await createComponent();
      component.defaultImages.set([imageInUse]);
      component.selectedDepartment.set(undefined);

      await component.loadDefaultImages();

      expect(component.defaultImages()).toEqual([]);
      expect(mockImageService.getDefaultJobBanners).not.toHaveBeenCalled();
    });

    it('loads images for the selected department', async () => {
      await createComponent();
      const option = { name: 'Dept 1', value: 'd1' };
      component.selectedDepartment.set(option);
      mockImageService.getDefaultJobBanners.mockReturnValue(of([imageInUse, imageNotInUse]));

      await component.loadDefaultImages();

      expect(mockImageService.getDefaultJobBanners).toHaveBeenCalledWith('d1');
      expect(component.defaultImages()).toEqual([imageInUse, imageNotInUse]);
    });

    it('shows an error toast when loading images fails', async () => {
      await createComponent();
      const option = { name: 'Dept 1', value: 'd1' };
      component.selectedDepartment.set(option);
      mockImageService.getDefaultJobBanners.mockReturnValue(throwError(() => new Error('Error')));

      await component.loadDefaultImages();

      expect(component.defaultImages()).toEqual([]);
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.images.error.loadImages');
    });
  });

  describe('uploading', () => {
    it('blocks upload when no department is selected', async () => {
      await createComponent();
      component.selectedDepartment.set(undefined);
      const result = component.uploadDefaultImage(createFile());
      let completed = false;

      result.subscribe({ complete: () => (completed = true) });

      expect(completed).toBe(true);
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.images.error.noDepartment');
      expect(mockImageService.uploadDefaultJobBanner).not.toHaveBeenCalled();
    });

    it('uploads a default image for the selected department', async () => {
      await createComponent();
      const option = { name: 'Dept 1', value: 'd1' };
      const file = createFile();
      component.selectedDepartment.set(option);

      let received: ImageDTO | undefined;
      component.uploadDefaultImage(file).subscribe(value => {
        received = value;
      });

      expect(mockImageService.uploadDefaultJobBanner).toHaveBeenCalledWith('d1', file);
      expect(received).toEqual(imageNotInUse);
    });

    it('adds uploaded images to the list', async () => {
      await createComponent();
      component.defaultImages.set([imageInUse]);

      component.onImageUploaded(imageNotInUse);

      expect(component.defaultImages()).toEqual([imageInUse, imageNotInUse]);
    });

    it('shows an error toast for upload errors', async () => {
      await createComponent();
      const error: ImageUploadError = { errorKey: 'upload.failed', type: 'uploadFailed' };

      component.onUploadError(error);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('upload.failed');
    });
  });

  describe('deleting', () => {
    it('skips delete when image id is missing', async () => {
      await createComponent();

      await component.onDeleteImage(undefined);

      expect(mockImageService.deleteImage).not.toHaveBeenCalled();
    });

    it('deletes an image and updates list', async () => {
      await createComponent();
      component.defaultImages.set([imageInUse, imageNotInUse]);

      await component.onDeleteImage('i1');

      expect(mockImageService.deleteImage).toHaveBeenCalledWith('i1');
      expect(component.defaultImages()).toEqual([imageNotInUse]);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.departments.images.success.imageDeleted');
    });

    it('shows an error toast when delete fails', async () => {
      await createComponent();
      mockImageService.deleteImage.mockReturnValue(throwError(() => new Error('Error')));

      await component.onDeleteImage('i1');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.departments.images.error.deleteFailed');
    });
  });

  describe('computed values', () => {
    it('splits images by usage', async () => {
      await createComponent();
      component.defaultImages.set([imageInUse, imageNotInUse, { imageId: 'i3', url: '/img/3.png' }]);

      expect(component.inUseImages()).toEqual([imageInUse]);
      expect(component.notInUseImages().length).toBe(2);
    });

    it('tracks upload availability based on selected department', async () => {
      await createComponent();

      expect(component.canUpload()).toBe(false);
      component.selectedDepartment.set({ name: 'Dept 1', value: 'd1' });
      expect(component.canUpload()).toBe(true);
    });
  });
});

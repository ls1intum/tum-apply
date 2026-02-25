import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type ImageResourceApiServiceMock = {
  getMyDefaultJobBanners: ReturnType<typeof vi.fn>;
  getDefaultJobBanners: ReturnType<typeof vi.fn>;
  getResearchGroupJobBanners: ReturnType<typeof vi.fn>;
  getResearchGroupJobBannersByResearchGroup: ReturnType<typeof vi.fn>;
  uploadJobBanner: ReturnType<typeof vi.fn>;
  uploadJobBannerForResearchGroup: ReturnType<typeof vi.fn>;
  uploadDefaultJobBanner: ReturnType<typeof vi.fn>;
  deleteImage: ReturnType<typeof vi.fn>;
  getDefaultJobBannersBySchool: ReturnType<typeof vi.fn>;
};

export function createImageResourceApiServiceMock(): ImageResourceApiServiceMock {
  return {
    getMyDefaultJobBanners: vi.fn(),
    getDefaultJobBanners: vi.fn(),
    getResearchGroupJobBanners: vi.fn(),
    getResearchGroupJobBannersByResearchGroup: vi.fn(),
    uploadJobBanner: vi.fn(),
    uploadJobBannerForResearchGroup: vi.fn(),
    uploadDefaultJobBanner: vi.fn(),
    deleteImage: vi.fn(),
    getDefaultJobBannersBySchool: vi.fn(),
  };
}

export function provideImageResourceApiServiceMock(mock: ImageResourceApiServiceMock = createImageResourceApiServiceMock()): Provider {
  return { provide: ImageResourceApiService, useValue: mock };
}

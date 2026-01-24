import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { PrivacyPageComponent } from 'app/shared/pages/privacy-page/privacy-page.component';
import { UserDataExportResourceApiService } from 'app/generated/api/api';
import { DataExportStatusDTO } from 'app/generated/model/models';

import { createToastServiceMock, provideToastServiceMock } from 'src/test/webapp/util/toast-service.mock';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';

describe('PrivacyPageComponent', () => {
  let fixture: ComponentFixture<PrivacyPageComponent>;
  let component: PrivacyPageComponent;

  const mockToast = createToastServiceMock();
  const mockUserDataExportService = {
    getDataExportStatus: vi.fn(),
    requestDataExport: vi.fn(),
  } as unknown as UserDataExportResourceApiService;

  beforeEach(async () => {
    mockToast.showErrorKey = vi.fn();
    mockToast.showInfoKey = vi.fn();
    mockUserDataExportService.getDataExportStatus = vi
      .fn()
      .mockReturnValue(of({ status: null, cooldownSeconds: 0 })) as unknown as UserDataExportResourceApiService['getDataExportStatus'];
    mockUserDataExportService.requestDataExport = vi.fn().mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [PrivacyPageComponent],
      providers: [
        { provide: UserDataExportResourceApiService, useValue: mockUserDataExportService },
        provideToastServiceMock(mockToast),
        provideTranslateMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request data export, set status, and show info toast', async () => {
    (mockUserDataExportService.getDataExportStatus as any).mockReturnValue(
      of({ status: DataExportStatusDTO.StatusEnum.InCreation, cooldownSeconds: 0 }),
    );

    await component.exportUserData();

    expect(mockUserDataExportService.requestDataExport).toHaveBeenCalledTimes(1);
    expect((component as any).currentExportStatus()).toBe(DataExportStatusDTO.StatusEnum.InCreation);
    expect((component as any).exportButtonDisabled()).toBe(true);
    expect((component as any).tooltip()).toBe('privacy.export.tooltip.inCreation');
    expect(mockToast.showInfoKey).toHaveBeenCalledWith('privacy.export.requested');
  });

  it('should keep button enabled before request', () => {
    expect((component as any).exportButtonDisabled()).toBe(false);
  });

  it('should show cooldown tooltip when disabled due to cooldown', () => {
    (component as any).cooldownSeconds.set(86400); // 1 day in seconds
    expect((component as any).exportButtonDisabled()).toBe(true);
    expect((component as any).tooltip()).toBe('privacy.export.tooltip.cooldown');
  });

  it('should no-op when button is disabled', async () => {
    (component as any).currentExportStatus.set(DataExportStatusDTO.StatusEnum.InCreation);
    await component.exportUserData();
    expect(mockUserDataExportService.requestDataExport).toHaveBeenCalledTimes(0);
  });

  it('should show 409 toast on conflict', async () => {
    mockUserDataExportService.requestDataExport = vi
      .fn()
      .mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409 })),
      ) as unknown as UserDataExportResourceApiService['requestDataExport'];

    await component.exportUserData();

    expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed409');
    expect((component as any).currentExportStatus()).toBeNull();
  });

  it('should show 429 toast on rate limit', async () => {
    mockUserDataExportService.requestDataExport = vi
      .fn()
      .mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 429 })),
      ) as unknown as UserDataExportResourceApiService['requestDataExport'];

    await component.exportUserData();

    expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed429');
    expect((component as any).currentExportStatus()).toBeNull();
  });

  it('should show generic toast on other HttpErrorResponse', async () => {
    mockUserDataExportService.requestDataExport = vi
      .fn()
      .mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 })),
      ) as unknown as UserDataExportResourceApiService['requestDataExport'];

    await component.exportUserData();

    expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed');
    expect((component as any).currentExportStatus()).toBeNull();
  });

  it('should show generic toast on non-Http error', async () => {
    mockUserDataExportService.requestDataExport = vi.fn().mockReturnValue(throwError(() => new Error('boom')));

    await component.exportUserData();

    expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed');
    expect((component as any).currentExportStatus()).toBeNull();
  });

  it('should show requestFailed toast when exportUserData throws non-HTTP error', async () => {
    mockUserDataExportService.requestDataExport = vi.fn().mockReturnValue(throwError(() => new Error('oops')));

    await component.exportUserData();

    expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed');
    expect((component as any).currentExportStatus()).toBeNull();
  });
});

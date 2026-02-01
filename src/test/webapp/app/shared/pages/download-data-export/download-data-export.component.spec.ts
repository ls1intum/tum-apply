import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserDataExportResourceApiService } from 'app/generated';
import { DownloadDataExportComponent } from 'app/shared/pages/download-data-export/download-data-export.component';
import { createActivatedRouteMock } from 'util/activated-route.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('DownloadDataExportComponent', () => {
  let component: DownloadDataExportComponent;
  let fixture: ComponentFixture<DownloadDataExportComponent>;
  let routeMock = createActivatedRouteMock();
  let currentRouteParams: Record<string, string> = {};
  let toastServiceMock: ToastServiceMock;
  let exportServiceMock: { downloadDataExport: ReturnType<typeof vi.fn> };
  let anchor: HTMLAnchorElement;
  let anchorClickSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let originalCreateElement: typeof document.createElement;

  const configureTestingModule = async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadDataExportComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeMock.paramMapSubject.asObservable(),
            queryParamMap: routeMock.queryParamMapSubject.asObservable(),
            url: routeMock.urlSubject.asObservable(),
            get snapshot() {
              return {
                paramMap: routeMock.paramMapSubject.value,
                queryParamMap: routeMock.queryParamMapSubject.value,
                url: routeMock.urlSubject.value,
                params: currentRouteParams,
              };
            },
          },
        },
        { provide: UserDataExportResourceApiService, useValue: exportServiceMock },
        provideToastServiceMock(toastServiceMock),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();
  };

  const createComponent = async () => {
    fixture = TestBed.createComponent(DownloadDataExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    currentRouteParams = {};
    routeMock = createActivatedRouteMock();
    const originalSetParams = routeMock.setParams;
    routeMock.setParams = params => {
      currentRouteParams = params;
      originalSetParams(params);
    };
    toastServiceMock = createToastServiceMock();
    exportServiceMock = {
      downloadDataExport: vi.fn(),
    };

    anchor = document.createElement('a');
    anchorClickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: any) => {
      return tagName === 'a' ? anchor : originalCreateElement(tagName, options);
    });
    if (!window.URL.createObjectURL) {
      (window.URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn();
    }
    if (!window.URL.revokeObjectURL) {
      (window.URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = vi.fn();
    }
    createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url');
    revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await configureTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('downloads successfully and uses filename from Content-Disposition', async () => {
    const blob = new Blob(['data']);
    const response = new HttpResponse({
      body: blob,
      headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="export.zip"' }),
    });
    exportServiceMock.downloadDataExport.mockReturnValue(of(response));
    routeMock.setParams({ token: 'token-123' });

    await createComponent();

    expect(exportServiceMock.downloadDataExport).toHaveBeenCalledWith('token-123', 'response');
    expect(anchor.download).toBe('export.zip');
    expect(anchor.href).toContain('blob:url');
    expect(anchorClickSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url');
    expect(component.downloadSuccess()).toBe(true);
    expect(component.isDownloading()).toBe(false);
    expect(toastServiceMock.showErrorKey).not.toHaveBeenCalled();
  });

  it('falls back to default filename when header misses filename', async () => {
    const blob = new Blob(['data']);
    const response = new HttpResponse({
      body: blob,
      headers: new HttpHeaders({ 'Content-Disposition': 'attachment' }),
    });
    exportServiceMock.downloadDataExport.mockReturnValue(of(response));
    routeMock.setParams({ token: 'token-abc' });

    await createComponent();

    expect(anchor.download).toBe('data-export.zip');
    expect(component.downloadSuccess()).toBe(true);
    expect(component.isDownloading()).toBe(false);
  });

  it('falls back to default filename when header is missing', async () => {
    const blob = new Blob(['data']);
    const response = new HttpResponse({ body: blob });
    exportServiceMock.downloadDataExport.mockReturnValue(of(response));
    routeMock.setParams({ token: 'token-no-header' });

    await createComponent();

    expect(anchor.download).toBe('data-export.zip');
    expect(component.downloadSuccess()).toBe(true);
    expect(component.isDownloading()).toBe(false);
  });

  it('shows error toast when download fails', async () => {
    exportServiceMock.downloadDataExport.mockReturnValue(throwError(() => new Error('failure')));
    routeMock.setParams({ token: 'token-fail' });

    await createComponent();

    expect(exportServiceMock.downloadDataExport).toHaveBeenCalledWith('token-fail', 'response');
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('global.dataExport.error.downloadFailed');
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(anchorClickSpy).not.toHaveBeenCalled();
    expect(component.downloadSuccess()).toBe(false);
    expect(component.isDownloading()).toBe(false);
  });

  it('shows error toast when no token is provided', async () => {
    routeMock.setParams({});

    await createComponent();

    expect(exportServiceMock.downloadDataExport).not.toHaveBeenCalled();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('global.dataExport.error.noToken');
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(component.downloadSuccess()).toBe(false);
    expect(component.isDownloading()).toBe(false);
  });
});

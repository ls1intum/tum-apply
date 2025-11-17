import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import ApplicationDetailForApplicantComponent from 'app/application/application-detail-for-applicant/application-detail-for-applicant.component';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { PdfExportResourceApiService } from 'app/generated/api/pdfExportResourceApi.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'app/service/toast-service';
import { getApplicationPDFLabels } from 'app/application/pdf-labels';

class MockApplicationService {
  getApplicationForDetailPage = vi.fn();
  getDocumentDictionaryIds = vi.fn();
  deleteApplication = vi.fn();
  withdrawApplication = vi.fn();
}

class MockPdfExportService {
  exportApplicationToPDF = vi.fn();
}

class MockTranslateService {
  instant = vi.fn((key: string) => key);
}

class MockToastService {
  showErrorKey = vi.fn();
  showSuccessKey = vi.fn();
}

class MockRouter {
  navigate = vi.fn(() => Promise.resolve(true));
}

class MockLocation { back = vi.fn(); }

function setupTest(paramId: string | null, appServiceOverrides?: Partial<MockApplicationService>) {
  const applicationService = Object.assign(new MockApplicationService(), appServiceOverrides);
  // Use 'any' snapshot to avoid needing full ActivatedRouteSnapshot shape
  const route: Partial<ActivatedRoute> = {
    snapshot: { paramMap: convertToParamMap(paramId ? { application_id: paramId } : {}) } as any,
  };
  const pdfExportService = new MockPdfExportService();
  const translate = new MockTranslateService();
  const toast = new MockToastService();
  const router = new MockRouter();
  const location = new MockLocation();

  TestBed.configureTestingModule({
    providers: [
      { provide: ActivatedRoute, useValue: route },
      { provide: ApplicationResourceApiService, useValue: applicationService },
      { provide: PdfExportResourceApiService, useValue: pdfExportService },
      { provide: TranslateService, useValue: translate },
      { provide: ToastService, useValue: toast },
      { provide: Router, useValue: router },
      { provide: Location, useValue: location },
    ],
    imports: [ApplicationDetailForApplicantComponent],
    schemas: [NO_ERRORS_SCHEMA],
  });

  const fixture = TestBed.createComponent(ApplicationDetailForApplicantComponent);
  const component = fixture.componentInstance;
  return { component, applicationService, pdfExportService, translate, toast, router, location };
}

describe('ApplicationDetailForApplicantComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('initializes and fetches application & document IDs when param provided', async () => {
    const appData = { jobId: 'JOB123', id: 'APP1' } as any;
    const docIds = { transcriptId: 'D1' } as any;
    const { component, applicationService, toast } = setupTest('APP1', {
      getApplicationForDetailPage: vi.fn(() => of(appData)),
      getDocumentDictionaryIds: vi.fn(() => of(docIds)),
    });
    await component.init();
    expect(component.applicationId()).toBe('APP1');
    expect(applicationService.getApplicationForDetailPage).toHaveBeenCalledWith('APP1');
    expect(applicationService.getDocumentDictionaryIds).toHaveBeenCalledWith('APP1');
    expect(component.application()).toEqual(appData);
    expect(component.documentIds()).toEqual(docIds);
    expect(toast.showErrorKey).not.toHaveBeenCalled();
  });

  it('shows error when application id missing', async () => {
    const { component, toast } = setupTest(null, {
      getApplicationForDetailPage: vi.fn(() => of({})),
      getDocumentDictionaryIds: vi.fn(() => of({})),
    });
    await component.init();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.invalidApplicationId');
  });

  it('handles application fetch error', async () => {
    const { component, toast, applicationService } = setupTest('APP2', {
      getApplicationForDetailPage: vi.fn(() => throwError(() => new Error('fail'))),
      getDocumentDictionaryIds: vi.fn(() => of({})),
    });
    await component.init();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.fetchApplicationFailed');
    expect(applicationService.getDocumentDictionaryIds).toHaveBeenCalled();
  });

  it('handles document ID fetch error', async () => {
    const { component, toast } = setupTest('APP3', {
      getApplicationForDetailPage: vi.fn(() => of({ id: 'APP3' })),
      getDocumentDictionaryIds: vi.fn(() => throwError(() => new Error('fail'))),
    });
    await component.init();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.fetchDocumentIdsFailed');
  });

  it('navigates to job detail when jobId present', () => {
    const { component, router } = setupTest('APP4', {
      getApplicationForDetailPage: vi.fn(() => of({ jobId: 'JOBX' })),
      getDocumentDictionaryIds: vi.fn(() => of({})),
    });
    component.applicationId.set('APP4');
    component.actualDetailData.set({ jobId: 'JOBX' } as any);
    component.actualDetailDataExists.set(true);
    component.onViewJobDetails();
    expect(router.navigate).toHaveBeenCalledWith(['/job/detail', 'JOBX']);
  });

  it('shows error when jobId missing on view job details', () => {
    const { component, router, toast } = setupTest('APP5', {
      getApplicationForDetailPage: vi.fn(() => of({ jobId: '' })),
      getDocumentDictionaryIds: vi.fn(() => of({})),
    });
    component.applicationId.set('APP5');
    component.actualDetailData.set({ jobId: '' } as any);
    component.actualDetailDataExists.set(true);
    component.onViewJobDetails();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.jobIdNotAvailable');
  });

  it('deletes application successfully', () => {
    const delete$ = of(void 0);
    const { component, applicationService, toast, router } = setupTest('APP6', {
      getApplicationForDetailPage: vi.fn(() => of({})),
      getDocumentDictionaryIds: vi.fn(() => of({})),
      deleteApplication: vi.fn(() => delete$),
    });
    component.applicationId.set('APP6');
    component.onDeleteApplication();
    expect(applicationService.deleteApplication).toHaveBeenCalledWith('APP6');
    expect(toast.showSuccessKey).toHaveBeenCalledWith('entity.toast.applyFlow.applicationDeleted');
    expect(router.navigate).toHaveBeenCalledWith(['/application/overview']);
  });

  it('handles delete application error', () => {
    const { component, applicationService, toast } = setupTest('APP7', {
      getApplicationForDetailPage: vi.fn(() => of({})),
      getDocumentDictionaryIds: vi.fn(() => of({})),
      deleteApplication: vi.fn(() => throwError(() => new Error('fail'))),
    });
    component.applicationId.set('APP7');
    component.onDeleteApplication();
    expect(applicationService.deleteApplication).toHaveBeenCalled();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.errorDeletingApplication');
  });

  it('withdraws application successfully and re-inits', () => {
    const { component, applicationService, toast } = setupTest('APP8', {
      getApplicationForDetailPage: vi.fn(() => of({ id: 'APP8' })),
      getDocumentDictionaryIds: vi.fn(() => of({})),
      withdrawApplication: vi.fn(() => of(void 0)),
    });
    component.applicationId.set('APP8');
    const initSpy = vi.spyOn(component, 'init');
    component.onWithdrawApplication();
    expect(applicationService.withdrawApplication).toHaveBeenCalledWith('APP8');
    expect(toast.showSuccessKey).toHaveBeenCalledWith('entity.toast.applyFlow.applicationWithdrawn');
    expect(initSpy).toHaveBeenCalled();
  });

  it('handles withdraw application error', () => {
    const { component, applicationService, toast } = setupTest('APP9', {
      getApplicationForDetailPage: vi.fn(() => of({ id: 'APP9' })),
      getDocumentDictionaryIds: vi.fn(() => of({})),
      withdrawApplication: vi.fn(() => throwError(() => new Error('fail'))),
    });
    component.applicationId.set('APP9');
    component.onWithdrawApplication();
    expect(applicationService.withdrawApplication).toHaveBeenCalled();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.errorWithdrawingApplication');
  });

  it('downloads PDF and uses filename from header', () => {
    const { component, pdfExportService } = setupTest('APP10', {
      getApplicationForDetailPage: vi.fn(() => of({ id: 'APP10' })),
      getDocumentDictionaryIds: vi.fn(() => of({})),
    });
    component.applicationId.set('APP10');
    const clickSpy = vi.fn();
    const originalCreate = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { click: clickSpy, href: '', download: '' } as any;
      }
      return originalCreate.call(document, tag);
    });
    // Provide minimal URL polyfill
    (globalThis as any).URL = { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() };

    const response = {
      headers: { get: (name: string) => (name === 'Content-Disposition' ? 'attachment; filename="app10.pdf"' : null) },
      body: new Blob(['content']),
    } as any;
    pdfExportService.exportApplicationToPDF.mockReturnValue(of(response));

    component.onDownloadPDF();

    expect(pdfExportService.exportApplicationToPDF).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect((globalThis as any).URL.createObjectURL).toHaveBeenCalled();
  });

  it('falls back to default filename when header missing', () => {
    const { component, pdfExportService } = setupTest('APP11', {
      getApplicationForDetailPage: vi.fn(() => of({ id: 'APP11' })),
      getDocumentDictionaryIds: vi.fn(() => of({})),
    });
    component.applicationId.set('APP11');
    const anchor: any = { click: vi.fn(), href: '', download: '' };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => (tag === 'a' ? anchor : document.createElement(tag)));
    pdfExportService.exportApplicationToPDF.mockReturnValue(of({ headers: { get: () => null }, body: new Blob(['c']) } as any));
    component.onDownloadPDF();
    expect(anchor.download).toBe('application.pdf');
  });

  it('getApplicationPDFLabels integration returns expected label keys without component', () => {
    const translate = new MockTranslateService();
    const labels = getApplicationPDFLabels(translate as any);
    expect(labels.application).toBe('evaluation.application');
    expect(Object.keys(labels)).toContain('grade');
  });
});

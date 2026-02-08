import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import ApplicationDetailForApplicantComponent from 'app/application/application-detail-for-applicant/application-detail-for-applicant.component';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';
import { TranslateService } from '@ngx-translate/core';
import { createTranslateServiceMock, TranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { createToastServiceMock, ToastServiceMock, provideToastServiceMock } from 'util/toast-service.mock';
import { createRouterMock, RouterMock, provideRouterMock } from 'util/router.mock';
import { createLocationMock, LocationMock, provideLocationMock } from 'util/location.mock';
import {
  createApplicationResourceApiServiceMock,
  ApplicationResourceApiServiceMock,
  provideApplicationResourceApiServiceMock,
} from 'util/application-resource-api.service.mock';
import { getApplicationPDFLabels } from 'app/shared/language/pdf-labels';
import { ApplicationDetailDTO } from 'app/generated/model/applicationDetailDTO';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/applicationDocumentIdsDTO';
import { createPdfExportResourceApiServiceMock, providePdfExportResourceApiServiceMock } from 'util/pdf-export-resource-api.service.mock';

function setupTest(paramId: string | null, appServiceOverrides?: Partial<ApplicationResourceApiServiceMock>) {
  const applicationService: ApplicationResourceApiServiceMock = {
    ...createApplicationResourceApiServiceMock(),
    ...(appServiceOverrides ?? {}),
  };

  const routeMock = createActivatedRouteMock(paramId ? { application_id: paramId } : {});
  const translate: TranslateServiceMock = createTranslateServiceMock();
  const pdfExportService = createPdfExportResourceApiServiceMock();
  const toast: ToastServiceMock = createToastServiceMock();
  const router: RouterMock = createRouterMock();
  const location: LocationMock = createLocationMock();

  TestBed.configureTestingModule({
    providers: [
      provideActivatedRouteMock(routeMock),
      provideApplicationResourceApiServiceMock(applicationService),
      providePdfExportResourceApiServiceMock(pdfExportService),
      provideTranslateMock(translate),
      provideToastServiceMock(toast),
      provideRouterMock(router),
      provideLocationMock(location),
    ],
    imports: [ApplicationDetailForApplicantComponent],
  });

  const fixture = TestBed.createComponent(ApplicationDetailForApplicantComponent);
  const component = fixture.componentInstance;
  return { component, applicationService, pdfExportService, translate, toast, router, location, routeMock };
}

const DEFAULT_APPLICATION_DETAIL: ApplicationDetailDTO = {
  applicationId: 'APP1',
  applicationState: 'SENT',
  jobId: 'JOB123',
  researchGroup: '',
  supervisingProfessorName: '',
} as ApplicationDetailDTO;

function makeDetail(overrides: Partial<ApplicationDetailDTO> = {}): ApplicationDetailDTO {
  return { ...DEFAULT_APPLICATION_DETAIL, ...overrides } as ApplicationDetailDTO;
}

describe('ApplicationDetailForApplicantComponent', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes and fetches application & document IDs when param provided', async () => {
    const appData = makeDetail({ applicationId: 'APP1', jobId: 'JOB123' });
    const docIds: ApplicationDocumentIdsDTO = {};
    const { component } = setupTest('APP1', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(appData)),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of(docIds)),
    });
    await component.init();
    expect(component.applicationId()).toBe('APP1');
    expect(component.application()).toEqual(appData);
    expect(component.documentIds()).toEqual(docIds);
  });

  describe('init() success flow (split AAA)', () => {
    const appData = { jobId: 'JOB123', id: 'APP1' };
    const docIds = { transcriptId: 'D1' };
    let component: ApplicationDetailForApplicantComponent;
    let applicationService: ApplicationResourceApiServiceMock;
    let toast: ToastServiceMock;

    beforeEach(async () => {
      // Arrange
      const setup = setupTest('APP1', {
        getApplicationForDetailPage: vi.fn((applicationId: string) => of(appData)),
        getDocumentDictionaryIds: vi.fn((applicationId: string) => of(docIds)),
      });
      component = setup.component;
      applicationService = setup.applicationService;
      toast = setup.toast;
      // Act
      await component.init();
    });

    it('sets applicationId and invokes both fetch services', () => {
      // Assert
      expect(component.applicationId()).toBe('APP1');
      expect(applicationService.getApplicationForDetailPage).toHaveBeenCalledWith('APP1');
      expect(applicationService.getDocumentDictionaryIds).toHaveBeenCalledWith('APP1');
    });

    it('stores application and document data in signals', () => {
      // Assert
      expect(component.application()).toEqual(appData);
      expect(component.documentIds()).toEqual(docIds);
    });

    it('does not emit an error toast on successful init', () => {
      // Assert
      expect(toast.showErrorKey).not.toHaveBeenCalled();
    });
  });

  it('shows error when application id missing', async () => {
    const { component, toast } = setupTest(null, {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'MISSING', jobId: 'JOBX' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
    });
    await component.init();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.invalidApplicationId');
  });

  it('handles application fetch error', async () => {
    const { component, toast, applicationService } = setupTest('APP2', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => throwError(() => new Error('fail'))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
    });
    await component.init();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.fetchApplicationFailed');
    expect(applicationService.getDocumentDictionaryIds).toHaveBeenCalled();
  });

  it('handles document ID fetch error', async () => {
    const { component, toast } = setupTest('APP3', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP3' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => throwError(() => new Error('fail'))),
    });
    await component.init();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.fetchDocumentIdsFailed');
  });

  it('navigates to job detail when jobId present', () => {
    const { component, router } = setupTest('APP4', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP4', jobId: 'JOBX' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
    });
    component.applicationId.set('APP4');
    // Supply minimal ApplicationDetailDTO required fields
    component.actualDetailData.set({
      jobId: 'JOBX',
      applicationId: 'APP4',
      applicationState: 'OPEN',
      researchGroup: null,
      supervisingProfessorName: '',
    } as unknown as any);
    component.actualDetailDataExists.set(true);
    component.onViewJobDetails();
    expect(router.navigate).toHaveBeenCalledWith(['/job/detail', 'JOBX']);
  });

  it('shows error when jobId missing on view job details', () => {
    const { component, router, toast } = setupTest('APP5', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP5', jobId: '' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
    });
    component.applicationId.set('APP5');
    component.actualDetailData.set({
      jobId: '',
      applicationId: 'APP5',
      applicationState: 'OPEN',
      researchGroup: null,
      supervisingProfessorName: '',
    } as unknown as any);
    component.actualDetailDataExists.set(true);
    component.onViewJobDetails();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.jobIdNotAvailable');
  });

  it('deletes application successfully', () => {
    const delete$ = of(void 0);
    const { component, applicationService, toast, router } = setupTest('APP6', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP6' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
      deleteApplication: vi.fn((applicationId: string) => delete$),
    });
    component.applicationId.set('APP6');
    component.onDeleteApplication();
    expect(applicationService.deleteApplication).toHaveBeenCalledWith('APP6');
    expect(toast.showSuccessKey).toHaveBeenCalledWith('entity.toast.applyFlow.applicationDeleted');
    expect(router.navigate).toHaveBeenCalledWith(['/application/overview']);
  });

  it('handles delete application error', () => {
    const { component, applicationService, toast } = setupTest('APP7', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP7' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
      deleteApplication: vi.fn((applicationId: string) => throwError(() => new Error('fail'))),
    });
    component.applicationId.set('APP7');
    component.onDeleteApplication();
    expect(applicationService.deleteApplication).toHaveBeenCalled();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.errorDeletingApplication');
  });

  it('withdraws application successfully and re-inits', () => {
    const { component, applicationService, toast } = setupTest('APP8', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP8' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
      withdrawApplication: vi.fn((applicationId: string) => of(void 0)),
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
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP9' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
      withdrawApplication: vi.fn((applicationId: string) => throwError(() => new Error('fail'))),
    });
    component.applicationId.set('APP9');
    component.onWithdrawApplication();
    expect(applicationService.withdrawApplication).toHaveBeenCalled();
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.errorWithdrawingApplication');
  });

  it('downloads PDF and uses filename from header', async () => {
    const { component, pdfExportService } = setupTest('APP10', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP10' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
    });
    component.applicationId.set('APP10');
    const clickSpy = vi.fn();
    const originalCreate = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { click: clickSpy, href: '', download: '' } as unknown as HTMLAnchorElement;
      }
      return originalCreate.call(document, tag);
    });
    // Provide minimal URL polyfill
    (globalThis as unknown as { URL: any }).URL = { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() };

    const response = {
      headers: { get: (name: string) => (name === 'Content-Disposition' ? 'attachment; filename="app10.pdf"' : null) },
      body: new Blob(['content']),
    } as { headers: { get: (name: string) => string | null }; body: Blob };
    pdfExportService.exportApplicationToPDF.mockReturnValue(of(response));

    await component.onDownloadPDF();

    expect(pdfExportService.exportApplicationToPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        application: expect.any(Object),
        labels: expect.any(Object),
      }),
      'response',
    );
    expect(clickSpy).toHaveBeenCalled();
    expect((globalThis as unknown as { URL: { createObjectURL: Function } }).URL.createObjectURL).toHaveBeenCalled();
  });

  it('falls back to default filename when header missing', async () => {
    const { component, pdfExportService } = setupTest('APP11', {
      getApplicationForDetailPage: vi.fn((applicationId: string) => of(makeDetail({ applicationId: 'APP11' }))),
      getDocumentDictionaryIds: vi.fn((applicationId: string) => of({} as ApplicationDocumentIdsDTO)),
    });
    component.applicationId.set('APP11');
    const anchor: { click: () => void; href: string; download: string } = { click: vi.fn(), href: '', download: '' };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'a' ? (anchor as unknown as HTMLElement) : document.createElement(tag),
    );

    const response = {
      headers: { get: () => null },
      body: new Blob(['c']),
    };
    pdfExportService.exportApplicationToPDF.mockReturnValue(of(response));

    await component.onDownloadPDF();

    expect(pdfExportService.exportApplicationToPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        application: expect.any(Object),
        labels: expect.any(Object),
      }),
      'response',
    );
    expect(anchor.download).toBe('application.pdf');
  });

  it('getApplicationPDFLabels integration returns expected label keys without component', () => {
    const translate = createTranslateServiceMock();
    const labels = getApplicationPDFLabels(translate as unknown as TranslateService);
    expect(labels.application).toBe('evaluation.application');
    expect(Object.keys(labels)).toContain('grade');
  });
});

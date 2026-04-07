import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage2Component, {
  ApplicationCreationPage2Data,
  getPage2FromApplication,
} from '../../../../../../main/webapp/app/application/application-creation/application-creation-page2/application-creation-page2.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';
import { provideHttpClient as provideHttpClientMock } from '@angular/common/http';
import {
  ApplicationForApplicantDTO,
  ApplicationForApplicantDTOApplicationStateEnum,
} from 'app/generated/model/application-for-applicant-dto';
import { JobFormDTOLocationEnum, JobFormDTOSubjectAreaEnum } from 'app/generated/model/job-form-dto';
import { provideToastServiceMock } from 'util/toast-service.mock';
import { provideAccountServiceMock } from 'util/account.service.mock';
import { createDialogServiceMock, DialogServiceMock, provideDialogServiceMock } from '../../../../util/dialog.service.mock';
import { firstValueFrom, Subject } from 'rxjs';
import { outputToObservable } from '@angular/core/rxjs-interop';

const DEFAULT_PAGE2_FORM_DATA: ApplicationCreationPage2Data = {
  bachelorDegreeName: '',
  bachelorDegreeUniversity: '',
  bachelorGrade: '',
  bachelorGradeLowerLimit: '',
  bachelorGradeUpperLimit: '',
  masterDegreeName: '',
  masterDegreeUniversity: '',
  masterGrade: '',
  masterGradeLowerLimit: '',
  masterGradeUpperLimit: '',
};

const VALID_PAGE2_FORM_DATA: ApplicationCreationPage2Data = {
  bachelorDegreeName: 'BSc',
  bachelorDegreeUniversity: 'Uni',
  bachelorGrade: '2.5',
  bachelorGradeLowerLimit: '1.0',
  bachelorGradeUpperLimit: '4.0',
  masterDegreeName: 'MSc',
  masterDegreeUniversity: 'Uni',
  masterGrade: '2.7',
  masterGradeLowerLimit: '1.0',
  masterGradeUpperLimit: '4.0',
};

function createApplicationPage2Fixture(
  inputs?: Partial<{
    data: Partial<ApplicationCreationPage2Data>;
    applicationIdForDocuments: string;
    documentIdsBachelorTranscript: DocumentInformationHolderDTO[];
    documentIdsMasterTranscript: DocumentInformationHolderDTO[];
  }>,
) {
  const fixture = TestBed.createComponent(ApplicationCreationPage2Component);
  const componentRef = fixture.componentRef;
  if (inputs) {
    if (inputs.applicationIdForDocuments !== undefined) {
      componentRef.setInput('applicationIdForDocuments', inputs.applicationIdForDocuments);
    }
    if (inputs.documentIdsBachelorTranscript !== undefined) {
      componentRef.setInput('documentIdsBachelorTranscript', inputs.documentIdsBachelorTranscript);
    }
    if (inputs.documentIdsMasterTranscript !== undefined) {
      componentRef.setInput('documentIdsMasterTranscript', inputs.documentIdsMasterTranscript);
    }
    componentRef.setInput('data', {
      ...DEFAULT_PAGE2_FORM_DATA,
      ...(inputs ? inputs.data : {}),
    });
  }
  fixture.detectChanges();

  return { fixture, componentRef: componentRef, componentInstance: fixture.componentInstance };
}

describe('ApplicationPage2Component', () => {
  let mockDialogService: DialogServiceMock;
  beforeEach(async () => {
    mockDialogService = createDialogServiceMock();
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage2Component],
      providers: [
        provideHttpClientMock(),
        provideRouter([]),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideToastServiceMock(),
        provideAccountServiceMock(),
        provideDialogServiceMock(mockDialogService),
      ],
    }).compileComponents();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      const { componentInstance } = createApplicationPage2Fixture();
      expect(componentInstance).toBeTruthy();
    });

    it('should populate the form with initial data', () => {
      const { componentInstance } = createApplicationPage2Fixture({
        data: {
          bachelorGradeUpperLimit: '4.0',
          bachelorGradeLowerLimit: '1.0',
          masterGradeUpperLimit: '4.0',
          masterGradeLowerLimit: '1.0',
        },
      });
      const formValues = componentInstance.page2Form.value;
      expect(formValues.bachelorDegreeName).toBe('');
      expect(formValues.bachelorDegreeUniversity).toBe('');
      expect(formValues.masterDegreeName).toBe('');
      expect(formValues.masterDegreeUniversity).toBe('');
      expect(formValues.bachelorGrade).toBe('');
      expect(formValues.masterGrade).toBe('');
      expect(formValues.bachelorGradeUpperLimit).toBe('4.0');
      expect(formValues.bachelorGradeLowerLimit).toBe('1.0');
      expect(formValues.masterGradeUpperLimit).toBe('4.0');
      expect(formValues.masterGradeLowerLimit).toBe('1.0');
    });

    it('should auto-detect grading scale when grade is set but limits are missing', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture({
        data: { bachelorGrade: '2.5', masterGrade: '3.0' },
      });

      await new Promise(resolve => setTimeout(resolve, 150));
      fixture.detectChanges();

      expect(componentInstance.bachelorGradeLimits()).not.toBeNull();
      expect(componentInstance.bachelorLimitsManuallySet()).toBe(false);
      expect(componentInstance.masterGradeLimits()).not.toBeNull();
      expect(componentInstance.masterLimitsManuallySet()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should have an invalid form when required fields are missing', () => {
      const { componentInstance } = createApplicationPage2Fixture();
      expect(componentInstance.page2Form.valid).toBe(false);
    });

    it('should validate the form with correct data', () => {
      const { componentInstance } = createApplicationPage2Fixture({
        data: VALID_PAGE2_FORM_DATA,
      });

      expect(componentInstance.page2Form.valid).toBe(true);
    });

    it('should validate grade correctly when within limits', () => {
      const { componentInstance } = createApplicationPage2Fixture();

      componentInstance.page2Form.setValue(VALID_PAGE2_FORM_DATA);

      expect(componentInstance.page2Form.valid).toBe(true);
    });
  });

  describe('Form Behavior', () => {
    it('should not emit if form value has not changed (distinctUntilChanged)', async () => {
      const { fixture, componentInstance } = createApplicationPage2Fixture();

      componentInstance.page2Form.patchValue({
        bachelorDegreeName: 'BSc',
        bachelorDegreeUniversity: 'Uni',
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      const changedSpy = vi.fn();
      componentInstance.changed.subscribe(changedSpy);

      componentInstance.page2Form.patchValue({
        bachelorDegreeName: 'BSc',
        bachelorDegreeUniversity: 'Uni',
      });

      await new Promise(resolve => setTimeout(resolve, 150));
      fixture.detectChanges();

      expect(changedSpy).not.toHaveBeenCalled();
    });

    it('should update grade limits when bachelor or master grade changes after initialization', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture({
        data: VALID_PAGE2_FORM_DATA,
      });

      await new Promise(resolve => setTimeout(resolve, 150));
      fixture.detectChanges();

      componentInstance.page2Form.controls.bachelorGrade.setValue('1.5');
      componentInstance.page2Form.controls.masterGrade.setValue('1.0');

      await new Promise(resolve => setTimeout(resolve, 600));
      fixture.detectChanges();

      expect(componentInstance.lastBachelorGrade()).toBe('1.5');
      expect(componentInstance.bachelorLimitsManuallySet()).toBe(false);
      expect(componentInstance.lastMasterGrade()).toBe('1.0');
      expect(componentInstance.masterLimitsManuallySet()).toBe(false);
    });

    it('should show warning text when bachelor or master grade is unusual', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture();

      await new Promise(resolve => setTimeout(resolve, 150));
      fixture.detectChanges();

      componentInstance.page2Form.controls.bachelorGrade.setValue('#');
      componentInstance.page2Form.controls.masterGrade.setValue('#');

      await new Promise(resolve => setTimeout(resolve, 600));
      fixture.detectChanges();

      expect(componentInstance.warningTextBachelorGrade()).not.toBe('');
      expect(componentInstance.warningTextMasterGrade()).not.toBe('');
    });
  });

  describe('Rendering', () => {
    it('should render upload buttons when applicationIdForDocuments is set', () => {
      const { fixture } = createApplicationPage2Fixture({
        applicationIdForDocuments: '12345',
        documentIdsBachelorTranscript: [{ id: 'id-1', size: 1 }],
        documentIdsMasterTranscript: [{ id: 'id-2', size: 2 }],
        data: DEFAULT_PAGE2_FORM_DATA,
      });

      const uploadButtons = fixture.nativeElement.querySelectorAll('jhi-upload-button');
      expect(uploadButtons.length).toBe(2); // Bachelor + Master
    });
  });

  describe('Document Validation', () => {
    it.each([
      { type: 'bachelor', expected: true, desc: 'provided', value: [{ id: '1', size: 1 }] },
      { type: 'bachelor', expected: false, desc: 'undefined', value: undefined },
      { type: 'bachelor', expected: false, desc: 'empty', value: [] },
      { type: 'master', expected: true, desc: 'provided', value: [{ id: '2', size: 2 }] },
      { type: 'master', expected: false, desc: 'undefined', value: undefined },
      { type: 'master', expected: false, desc: 'empty', value: [] },
    ])('should compute $type-DocsValid to $expected when $type docs are $desc', ({ type, expected, value }) => {
      const { componentInstance, fixture } = createApplicationPage2Fixture();

      if (type === 'bachelor') {
        componentInstance.documentIdsBachelorTranscript.set(value as DocumentInformationHolderDTO[]);
        fixture.detectChanges();
        expect(componentInstance.bachelorDocsValid()).toBe(expected);
      } else {
        componentInstance.documentIdsMasterTranscript.set(value as DocumentInformationHolderDTO[]);
        fixture.detectChanges();
        expect(componentInstance.masterDocsValid()).toBe(expected);
      }
    });

    it.each([
      {
        desc: 'both transcripts are present',
        expected: true,
        bachelorDocs: [{ id: 'b-1', size: 1 }],
        masterDocs: [{ id: 'm-1', size: 1 }],
      },
      {
        desc: 'transcripts are missing',
        expected: false,
        bachelorDocs: [],
        masterDocs: [],
      },
    ])('should emit valid=$expected when form data is valid and $desc', async ({ expected, bachelorDocs, masterDocs }) => {
      const { componentInstance, fixture } = createApplicationPage2Fixture({
        data: VALID_PAGE2_FORM_DATA,
        documentIdsBachelorTranscript: bachelorDocs,
        documentIdsMasterTranscript: masterDocs,
      });

      const valid = outputToObservable(componentInstance.valid);
      const validPromise = firstValueFrom(valid);

      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 200));

      const result = await validPromise;
      expect(result).toBe(expected);
    });
  });

  describe('getPage2FromApplication', () => {
    const standardApplicationForApplicantDTO: ApplicationForApplicantDTO = {
      applicant: {
        bachelorDegreeName: 'BSc CS',
        bachelorUniversity: 'Test University',
        bachelorGradeUpperLimit: '4.0',
        bachelorGradeLowerLimit: '1.0',
        bachelorGrade: '3.5',
        masterDegreeName: 'MSc AI',
        masterUniversity: 'Test University',
        masterGradeUpperLimit: '4.0',
        masterGradeLowerLimit: '1.0',
        masterGrade: '3.8',
        user: {},
      },
      job: {
        jobId: 'id-123',
        location: JobFormDTOLocationEnum.Garching,
        professorName: 'Pr. Test',
        title: 'Job title',
        subjectArea: JobFormDTOSubjectAreaEnum.ComputerScience,
      },
      applicationState: ApplicationForApplicantDTOApplicationStateEnum.Saved,
    };

    it('should map all applicant fields correctly when provided', () => {
      const application: ApplicationForApplicantDTO = { ...standardApplicationForApplicantDTO };

      const result = getPage2FromApplication(application);

      expect(result).toEqual({
        bachelorDegreeName: standardApplicationForApplicantDTO.applicant?.bachelorDegreeName,
        bachelorDegreeUniversity: standardApplicationForApplicantDTO.applicant?.bachelorUniversity,
        bachelorGradeUpperLimit: standardApplicationForApplicantDTO.applicant?.bachelorGradeUpperLimit,
        bachelorGradeLowerLimit: standardApplicationForApplicantDTO.applicant?.bachelorGradeLowerLimit,
        bachelorGrade: standardApplicationForApplicantDTO.applicant?.bachelorGrade,
        masterDegreeName: standardApplicationForApplicantDTO.applicant?.masterDegreeName,
        masterDegreeUniversity: standardApplicationForApplicantDTO.applicant?.masterUniversity,
        masterGradeUpperLimit: standardApplicationForApplicantDTO.applicant?.masterGradeUpperLimit,
        masterGradeLowerLimit: standardApplicationForApplicantDTO.applicant?.masterGradeLowerLimit,
        masterGrade: standardApplicationForApplicantDTO.applicant?.masterGrade,
      });
    });

    it('should return empty strings for all fields if applicant is undefined', () => {
      const application: ApplicationForApplicantDTO = {
        ...standardApplicationForApplicantDTO,
        applicant: undefined,
      };

      const result = getPage2FromApplication(application);

      expect(result).toEqual(DEFAULT_PAGE2_FORM_DATA);
    });

    it('should return empty strings for missing fields in applicant', () => {
      const application: ApplicationForApplicantDTO = {
        ...standardApplicationForApplicantDTO,
        applicant: {
          bachelorDegreeName: 'BSc Biology',
          // all other fields are missing
          user: {},
        },
      };

      const result = getPage2FromApplication(application);

      expect(result).toEqual({
        ...DEFAULT_PAGE2_FORM_DATA,
        bachelorDegreeName: 'BSc Biology',
      });
    });
  });

  describe('onChangeGradingScale', () => {
    it('should open dialog with correct data for bachelor grading scale', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture({
        data: VALID_PAGE2_FORM_DATA,
      });

      await new Promise(resolve => setTimeout(resolve, 150));
      fixture.detectChanges();

      const onCloseSub = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
      mockDialogService.open = vi.fn().mockReturnValue({ onClose: onCloseSub.asObservable() });

      componentInstance.onChangeGradingScale('bachelor');

      expect(mockDialogService.open).toHaveBeenCalledOnce();
      expect(mockDialogService.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            gradeType: 'bachelor',
            currentGrade: VALID_PAGE2_FORM_DATA.bachelorGrade,
            currentUpperLimit: VALID_PAGE2_FORM_DATA.bachelorGradeUpperLimit,
            currentLowerLimit: VALID_PAGE2_FORM_DATA.bachelorGradeLowerLimit,
          }),
        }),
      );
    });

    it('should open dialog with correct data for master grading scale', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture({
        data: VALID_PAGE2_FORM_DATA,
      });

      await new Promise(resolve => setTimeout(resolve, 150));
      fixture.detectChanges();

      const onCloseSub = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
      mockDialogService.open = vi.fn().mockReturnValue({ onClose: onCloseSub.asObservable() });

      componentInstance.onChangeGradingScale('master');

      expect(mockDialogService.open).toHaveBeenCalledOnce();
      expect(mockDialogService.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            gradeType: 'master',
            currentGrade: VALID_PAGE2_FORM_DATA.masterGrade,
            currentUpperLimit: VALID_PAGE2_FORM_DATA.masterGradeUpperLimit,
            currentLowerLimit: VALID_PAGE2_FORM_DATA.masterGradeLowerLimit,
          }),
        }),
      );
    });

    it('should update bachelor limits and set manuallySet flag when dialog returns a result', () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture();

      fixture.detectChanges();

      const onCloseSub = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
      mockDialogService.open = vi.fn().mockReturnValue({ onClose: onCloseSub.asObservable() });

      componentInstance.onChangeGradingScale('bachelor');

      onCloseSub.next({ upperLimit: '5.0', lowerLimit: '1.0' });
      fixture.detectChanges();

      expect(componentInstance.page2Form.get('bachelorGradeUpperLimit')?.value).toBe('5.0');
      expect(componentInstance.page2Form.get('bachelorGradeLowerLimit')?.value).toBe('1.0');
      expect(componentInstance.bachelorGradeLimits()).toEqual({ upperLimit: '5.0', lowerLimit: '1.0' });
      expect(componentInstance.bachelorLimitsManuallySet()).toBe(true);
    });

    it('should update master limits and set manuallySet flag when dialog returns a result', () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture();

      fixture.detectChanges();

      const onCloseSub = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
      mockDialogService.open = vi.fn().mockReturnValue({ onClose: onCloseSub.asObservable() });

      componentInstance.onChangeGradingScale('master');

      onCloseSub.next({ upperLimit: '10.0', lowerLimit: '1.0' });
      fixture.detectChanges();

      expect(componentInstance.page2Form.get('masterGradeUpperLimit')?.value).toBe('10.0');
      expect(componentInstance.page2Form.get('masterGradeLowerLimit')?.value).toBe('1.0');
      expect(componentInstance.masterGradeLimits()).toEqual({ upperLimit: '10.0', lowerLimit: '1.0' });
      expect(componentInstance.masterLimitsManuallySet()).toBe(true);
    });

    it('should not update limits when dialog is closed without a result', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture({
        data: { bachelorGrade: '2.5' },
      });

      await new Promise(resolve => setTimeout(resolve, 150));
      fixture.detectChanges();

      const onCloseSub = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
      mockDialogService.open = vi.fn().mockReturnValue({ onClose: onCloseSub.asObservable() });

      componentInstance.onChangeGradingScale('bachelor');
      const limitsBefore = componentInstance.bachelorGradeLimits();

      onCloseSub.next(undefined);
      fixture.detectChanges();

      expect(componentInstance.bachelorGradeLimits()).toEqual(limitsBefore);
      expect(componentInstance.bachelorLimitsManuallySet()).toBe(false);
    });

    it('should call updateBachelorGradeLimits with empty string when bachelor grade is null', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture({
        data: VALID_PAGE2_FORM_DATA,
      });

      componentInstance.page2Form.controls.bachelorGrade.setValue(null);
      await new Promise(resolve => setTimeout(resolve, 600));
      fixture.detectChanges();

      expect(componentInstance.lastBachelorGrade()).toBe('');
      expect(componentInstance.bachelorLimitsManuallySet()).toBe(false);
    });

    it('should call updateMasterGradeLimits with empty string when master grade is null', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture({
        data: VALID_PAGE2_FORM_DATA,
      });

      componentInstance.page2Form.controls.masterGrade.setValue(null);
      await new Promise(resolve => setTimeout(resolve, 600));
      fixture.detectChanges();

      expect(componentInstance.lastMasterGrade()).toBe('');
      expect(componentInstance.masterLimitsManuallySet()).toBe(false);
    });

    it('should use empty string fallback for upper/lower limits when bachelor limit controls are null', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture();

      componentInstance.page2Form.controls.bachelorGradeUpperLimit.setValue(null);
      componentInstance.page2Form.controls.bachelorGradeLowerLimit.setValue(null);
      fixture.detectChanges();

      const onCloseSub = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
      mockDialogService.open = vi.fn().mockReturnValue({ onClose: onCloseSub.asObservable() });

      componentInstance.onChangeGradingScale('bachelor');

      expect(mockDialogService.open).toHaveBeenCalledOnce();
      expect(mockDialogService.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            gradeType: 'bachelor',
            currentUpperLimit: '',
            currentLowerLimit: '',
          }),
        }),
      );
    });

    it('should use empty string fallback for upper/lower limits when master limit controls are null (covers ?.value ?? "" branch)', async () => {
      const { componentInstance, fixture } = createApplicationPage2Fixture();

      componentInstance.page2Form.controls.masterGradeUpperLimit.setValue(null);
      componentInstance.page2Form.controls.masterGradeLowerLimit.setValue(null);
      fixture.detectChanges();

      const onCloseSub = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
      mockDialogService.open = vi.fn().mockReturnValue({ onClose: onCloseSub.asObservable() });

      componentInstance.onChangeGradingScale('master');

      expect(mockDialogService.open).toHaveBeenCalledOnce();
      expect(mockDialogService.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            gradeType: 'master',
            currentUpperLimit: '',
            currentLowerLimit: '',
          }),
        }),
      );
    });
  });
});

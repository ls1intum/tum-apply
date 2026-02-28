import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage2Component, {
  ApplicationCreationPage2Data,
  getPage2FromApplication,
} from '../../../../../main/webapp/app/application/application-creation/application-creation-page2/application-creation-page2.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { provideHttpClient as provideHttpClientMock } from '@angular/common/http';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { provideToastServiceMock } from 'util/toast-service.mock';
import { provideAccountServiceMock } from 'util/account.service.mock';
import { createDialogServiceMock, DialogServiceMock, provideDialogServiceMock } from '../../../util/dialog.service.mock';

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
        location: 'Garching',
        professorName: 'Pr. Test',
        title: 'Job title',
      },
      applicationState: 'SAVED',
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
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage2Component, { ApplicationCreationPage2Data, getPage2FromApplication } from '../../../../../main/webapp/app/application/application-creation/application-creation-page2/application-creation-page2.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AccountService } from 'app/core/auth/account.service';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { HttpClient } from '@angular/common/http';
import { ToastService } from 'app/service/toast-service';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';

class MockHttpClient {
  get = vi.fn();
  post = vi.fn();
  put = vi.fn();
  delete = vi.fn();
}

class MockToastService {
  showError = vi.fn();
}

function createApplicationPage2Fixture(inputs?: Partial<{ data: Partial<ApplicationCreationPage2Data>, applicationIdForDocuments: string, documentIdsBachelorTranscript: DocumentInformationHolderDTO[], documentIdsMasterTranscript: DocumentInformationHolderDTO[] }>) {
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
    if (inputs.data !== undefined) {
      componentRef.setInput('data', {
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
        ...inputs.data,
      });
    } else {
      componentRef.setInput('data', {
        bachelorDegreeName: '',
        bachelorDegreeUniversity: '',
        bachelorGrade: '',
        bachelorGradeLowerLimit: '',
        bachelorGradeUpperLimit: '',
        masterDegreeName: '',
        masterDegreeUniversity: '',
        masterGrade: '',
        masterGradeLowerLimit: '',
        masterGradeUpperLimit: ''
      }
      )
    }
  }
  fixture.detectChanges();

  return { fixture, componentRef: componentRef, componentInstance: fixture.componentInstance };
}

describe('ApplicationPage2Component', () => {
  let accountService: Pick<AccountService, 'signedIn'>;
  let toastService: Pick<ToastService, 'showError'>;

  beforeEach(async () => {
    accountService = {
      signedIn: signal<boolean>(true),
    };

    toastService = new MockToastService();

    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage2Component],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: ToastService, useValue: toastService },
        { provide: HttpClient, useClass: MockHttpClient },
        provideRouter([]),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();
  });
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
      }
    });
    const formValues = componentInstance.page2Form.value;
    expect(formValues.bachelorDegreeName).toBe('');
    expect(formValues.bachelorDegreeUniversity).toBe('');
    expect(formValues.masterDegreeName).toBe('');
    expect(formValues.masterDegreeUniversity).toBe('');
    expect(formValues.bachelorGrade).toBe('');
    expect(formValues.masterGrade).toBe('');
  });

  it('should have an invalid form when required fields are missing', () => {
    const { componentInstance } = createApplicationPage2Fixture();
    expect(componentInstance.page2Form.valid).toBe(false);
  });

  it('should validate the form with correct data', () => {
    const { componentInstance } = createApplicationPage2Fixture({
      data: {
        bachelorDegreeName: 'BSc Computer Science',
        bachelorDegreeUniversity: 'Test University',
        bachelorGrade: '3.5',
        masterDegreeName: 'MSc Computer Science',
        masterDegreeUniversity: 'Test University',
        masterGrade: '3.8',
        bachelorGradeLowerLimit: '4.0',
        bachelorGradeUpperLimit: '1.0',
        masterGradeLowerLimit: '4.0',
        masterGradeUpperLimit: '1.0'
      }
    });

    expect(componentInstance.page2Form.valid).toBe(true);
  });

  it('should mark fields as touched and invalid when initialized with incomplete data', () => {
    const { componentInstance } = createApplicationPage2Fixture({
      data: {
        bachelorGradeUpperLimit: '4.0',
        bachelorGradeLowerLimit: '1.0',
        masterGradeUpperLimit: '4.0',
        masterGradeLowerLimit: '1.0',
      }
    });

    const bachelorGradeControl = componentInstance.page2Form.get('bachelorGrade');
    expect(bachelorGradeControl?.touched).toBe(false); // Empty → not marked
    expect(bachelorGradeControl?.valid).toBe(false); // Invalid because required

    const upperLimitControl = componentInstance.page2Form.get('bachelorGradeUpperLimit');
    expect(upperLimitControl?.touched).toBe(true); // Marked as touched
  });

  it('should have invalid form if bachelor grade is out of range', () => {
    const { componentInstance } = createApplicationPage2Fixture();

    componentInstance.page2Form.setValue({
      bachelorDegreeName: 'BSc',
      bachelorDegreeUniversity: 'Uni',
      bachelorGrade: '4.5', // Invalid
      bachelorGradeLowerLimit: '1.0',
      bachelorGradeUpperLimit: '4.0',
      masterDegreeName: 'MSc',
      masterDegreeUniversity: 'Uni',
      masterGrade: '3.5',
      masterGradeLowerLimit: '1.0',
      masterGradeUpperLimit: '4.0',
    });

    expect(componentInstance.page2Form.valid).toBe(false);
  });

  it('should validate grade correctly when within limits', () => {
    const { componentInstance } = createApplicationPage2Fixture();

    componentInstance.page2Form.setValue({
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
    });

    expect(componentInstance.page2Form.valid).toBe(true);
  });

  it('should render upload buttons when applicationIdForDocuments is set', () => {
    const { fixture } = createApplicationPage2Fixture({
      applicationIdForDocuments: '12345',
      documentIdsBachelorTranscript: [{ id: 'id-1', size: 1 }],
      documentIdsMasterTranscript: [{ id: 'id-2', size: 2 }],
      data: {
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
      },
    });

    const uploadButtons = fixture.nativeElement.querySelectorAll('jhi-upload-button');
    expect(uploadButtons.length).toBe(2); // Bachelor + Master
  });

  describe('getPage2FromApplication', () => {
    const createEmptyApplicationForApplicantDTO = (): ApplicationForApplicantDTO => ({
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
        user: {
        },
      },
      job: {
        fieldOfStudies: '',
        jobId: '',
        location: '',
        professorName: '',
        title: ''
      },
      applicationState: 'SAVED'
    });

    it('should map all applicant fields correctly when provided', () => {
      const application: ApplicationForApplicantDTO = createEmptyApplicationForApplicantDTO();

      const result = getPage2FromApplication(application);

      expect(result).toEqual({
        bachelorDegreeName: 'BSc CS',
        bachelorDegreeUniversity: 'Test University',
        bachelorGradeUpperLimit: '4.0',
        bachelorGradeLowerLimit: '1.0',
        bachelorGrade: '3.5',
        masterDegreeName: 'MSc AI',
        masterDegreeUniversity: 'Test University',
        masterGradeUpperLimit: '4.0',
        masterGradeLowerLimit: '1.0',
        masterGrade: '3.8',
      });
    });

    it('should return empty strings for all fields if applicant is undefined', () => {
      const application: ApplicationForApplicantDTO = {
        ...createEmptyApplicationForApplicantDTO(),
        applicant: undefined
      };

      const result = getPage2FromApplication(application);

      expect(result).toEqual({
        bachelorDegreeName: '',
        bachelorDegreeUniversity: '',
        bachelorGradeUpperLimit: '',
        bachelorGradeLowerLimit: '',
        bachelorGrade: '',
        masterDegreeName: '',
        masterDegreeUniversity: '',
        masterGradeUpperLimit: '',
        masterGradeLowerLimit: '',
        masterGrade: '',
      });
    });

    it('should return empty strings for missing fields in applicant', () => {
      const application: ApplicationForApplicantDTO = {
        ...createEmptyApplicationForApplicantDTO(),
        applicant: {
          bachelorDegreeName: 'BSc Biology',
          // all other fields are missing
          user: {}
        },
      };

      const result = getPage2FromApplication(application);

      expect(result).toEqual({
        bachelorDegreeName: 'BSc Biology',
        bachelorDegreeUniversity: '',
        bachelorGradeUpperLimit: '',
        bachelorGradeLowerLimit: '',
        bachelorGrade: '',
        masterDegreeName: '',
        masterDegreeUniversity: '',
        masterGradeUpperLimit: '',
        masterGradeLowerLimit: '',
        masterGrade: '',
      });
    });
  });
});

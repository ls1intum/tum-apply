import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import { ApplicantDTO } from 'app/generated/model/applicant-dto';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/application-document-ids-dto';

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends object ? Mutable<T[P]> : T[P] };
import { ApplicationInformationSettingsComponent } from 'app/shared/settings/application-information-settings';
import { SettingsDocumentsComponent } from 'app/shared/settings/settings-documents/settings-documents.component';
import { createApplicantResourceApiMock } from 'util/applicant-resource-api.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createDialogServiceMock, provideDialogServiceMock } from '../../../util/dialog.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';

describe('Profile save isolation', () => {
  const baseProfile: Mutable<ApplicantDTO> = {
    user: {
      userId: 'user-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '+491234567',
      gender: 'FEMALE',
      nationality: 'DE',
      birthday: '1990-01-01',
      website: 'https://ada.example.com',
      linkedinUrl: 'https://linkedin.com/in/ada',
    },
    street: 'Main Street 1',
    postalCode: '80333',
    city: 'Munich',
    country: 'DE',
    bachelorDegreeName: 'BSc Computer Science',
    bachelorUniversity: 'TUM',
    bachelorGrade: '1.3',
    bachelorGradeUpperLimit: '1.0',
    bachelorGradeLowerLimit: '4.0',
    masterDegreeName: 'MSc Computer Science',
    masterUniversity: 'TUM',
    masterGrade: '1.1',
    masterGradeUpperLimit: '1.0',
    masterGradeLowerLimit: '4.0',
  };

  const baseDocumentIds: Mutable<ApplicationDocumentIdsDTO> = {
    bachelorDocumentDictionaryIds: [{ id: 'bachelor-doc-1', name: 'bachelor.pdf', size: 100 }],
    masterDocumentDictionaryIds: [{ id: 'master-doc-1', name: 'master.pdf', size: 100 }],
    cvDocumentDictionaryId: { id: 'cv-doc-1', name: 'cv.pdf', size: 100 },
    referenceDocumentDictionaryIds: [{ id: 'reference-doc-1', name: 'reference.pdf', size: 100 }],
  };

  const applicantApiMock = createApplicantResourceApiMock();

  const accountServiceMock = createAccountServiceMock();
  const toastServiceMock = createToastServiceMock();
  const dialogServiceMock = createDialogServiceMock();
  const httpClientMock = {
    post: vi.fn(),
  };
  const cloneValue = <T>(value: T): Mutable<T> => structuredClone(value) as Mutable<T>;
  const createDocumentsComponent = async (): Promise<SettingsDocumentsComponent> => {
    const component = TestBed.runInInjectionContext(() => new SettingsDocumentsComponent());
    await component['loadProfile']();
    return component;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    applicantApiMock.getApplicantProfile.mockReturnValue(of(baseProfile));
    applicantApiMock.getApplicantProfileDocumentIds.mockReturnValue(of(baseDocumentIds));
    applicantApiMock.updateApplicantPersonalInformation.mockReturnValue(of(baseProfile));
    applicantApiMock.updateApplicantDocumentSettings.mockReturnValue(of(baseProfile));
    applicantApiMock.uploadApplicantDocuments.mockReturnValue(of([]));
    applicantApiMock.deleteApplicantProfileDocument.mockReturnValue(of(undefined));
    applicantApiMock.renameApplicantProfileDocument.mockReturnValue(of(undefined));
    httpClientMock.post.mockReset();
    httpClientMock.post.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ApplicantResourceApi, useValue: applicantApiMock },
        { provide: HttpClient, useValue: httpClientMock },
        provideDialogServiceMock(dialogServiceMock),
        provideAccountServiceMock(accountServiceMock),
        provideToastServiceMock(toastServiceMock),
        provideFontAwesomeTesting(),
      ],
    });
  });

  it('documents save uses the latest application information saved in another tab', async () => {
    const profileAfterPersonalSave = cloneValue(baseProfile);
    profileAfterPersonalSave.user!.firstName = 'Grace';
    const profileAfterBothSaves = cloneValue(profileAfterPersonalSave);
    profileAfterBothSaves.bachelorGrade = '1.0';

    applicantApiMock.getApplicantProfile.mockReset();
    applicantApiMock.getApplicantProfile
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(profileAfterPersonalSave))
      .mockReturnValueOnce(of(profileAfterBothSaves));
    applicantApiMock.getApplicantProfileDocumentIds.mockReset();
    applicantApiMock.getApplicantProfileDocumentIds.mockReturnValue(of(baseDocumentIds));
    applicantApiMock.updateApplicantPersonalInformation.mockReset();
    applicantApiMock.updateApplicantDocumentSettings.mockReset();
    applicantApiMock.updateApplicantPersonalInformation
      .mockReturnValueOnce(of(profileAfterPersonalSave))
      .mockReturnValueOnce(of(profileAfterPersonalSave));
    applicantApiMock.updateApplicantDocumentSettings.mockReturnValueOnce(of(profileAfterBothSaves));

    const personalComponent = TestBed.runInInjectionContext(() => new ApplicationInformationSettingsComponent());
    await personalComponent.loadApplicationInformation();

    const documentsComponent = await createDocumentsComponent();

    const updatedPersonalData = cloneValue(personalComponent.data());
    updatedPersonalData.firstName = 'Grace';
    personalComponent.data.set(updatedPersonalData);
    documentsComponent.form.patchValue({
      bachelorGrade: '1.0',
    });

    await personalComponent.onSave();
    await documentsComponent.saveAll();

    expect(applicantApiMock.updateApplicantDocumentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          userId: accountServiceMock.userId,
        }),
        bachelorGrade: '1.0',
      }),
    );
    expect(applicantApiMock.updateApplicantPersonalInformation).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          firstName: 'Grace',
        }),
      }),
    );
  });

  it('application information save uses the latest document settings saved in another tab', async () => {
    const profileAfterDocumentsSave = cloneValue(baseProfile);
    profileAfterDocumentsSave.bachelorGrade = '1.0';
    const profileAfterBothSaves = cloneValue(profileAfterDocumentsSave);
    profileAfterBothSaves.user!.firstName = 'Grace';

    applicantApiMock.getApplicantProfile.mockReset();
    applicantApiMock.getApplicantProfile
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(profileAfterDocumentsSave))
      .mockReturnValueOnce(of(profileAfterDocumentsSave));
    applicantApiMock.getApplicantProfileDocumentIds.mockReset();
    applicantApiMock.getApplicantProfileDocumentIds.mockReturnValue(of(baseDocumentIds));
    applicantApiMock.updateApplicantDocumentSettings.mockReset();
    applicantApiMock.updateApplicantPersonalInformation.mockReset();
    applicantApiMock.updateApplicantDocumentSettings
      .mockReturnValueOnce(of(profileAfterDocumentsSave))
      .mockReturnValueOnce(of(profileAfterDocumentsSave));
    applicantApiMock.updateApplicantPersonalInformation.mockReturnValueOnce(of(profileAfterBothSaves));

    const documentsComponent = await createDocumentsComponent();

    const personalComponent = TestBed.runInInjectionContext(() => new ApplicationInformationSettingsComponent());
    await personalComponent.loadApplicationInformation();

    documentsComponent.form.patchValue({
      bachelorGrade: '1.0',
    });
    const updatedPersonalData = cloneValue(personalComponent.data());
    updatedPersonalData.firstName = 'Grace';
    personalComponent.data.set(updatedPersonalData);

    await documentsComponent.saveAll();
    await personalComponent.onSave();

    expect(applicantApiMock.updateApplicantPersonalInformation).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          firstName: 'Grace',
        }),
      }),
    );
    expect(applicantApiMock.updateApplicantDocumentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        bachelorGrade: '1.0',
        user: expect.objectContaining({
          userId: accountServiceMock.userId,
        }),
      }),
    );
  });

  it('keeps stored grading scale limits when documents settings initializes', async () => {
    vi.useFakeTimers();

    const profileWithManualLimits = cloneValue(baseProfile);
    profileWithManualLimits.bachelorGrade = '84%';
    profileWithManualLimits.bachelorGradeUpperLimit = '100%';
    profileWithManualLimits.bachelorGradeLowerLimit = '60%';

    applicantApiMock.getApplicantProfile.mockReset();
    applicantApiMock.getApplicantProfile.mockReturnValue(of(profileWithManualLimits));

    const documentsComponent = await createDocumentsComponent();

    await vi.advanceTimersByTimeAsync(600);

    expect(documentsComponent.form.controls.bachelorGradeUpperLimit.value).toBe('100%');
    expect(documentsComponent.form.controls.bachelorGradeLowerLimit.value).toBe('60%');
    expect(documentsComponent.bachelorGradeLimits()).toEqual({
      upperLimit: '100%',
      lowerLimit: '60%',
      isPercentage: true,
    });

    vi.useRealTimers();
  });

  it('preserves disabled email field when another application information field changes', async () => {
    const fixture = TestBed.createComponent(ApplicationInformationSettingsComponent);
    const personalComponent = fixture.componentInstance;
    await personalComponent.loadApplicationInformation();
    fixture.detectChanges();

    const form = personalComponent.applicationInfoForm();
    form.controls.firstName.setValue('Grace');
    fixture.detectChanges();

    expect(personalComponent.data().email).toBe(baseProfile.user?.email);
    expect(personalComponent.data().firstName).toBe('Grace');
  });

  it('uploads queued applicant documents when settings documents are saved', async () => {
    const documentsComponent = await createDocumentsComponent();
    const newBachelorTranscript = new File(['bachelor transcript'], 'new-bachelor.pdf', { type: 'application/pdf' });
    const bachelorDocuments = documentsComponent.bachelorDocuments() ?? [];

    documentsComponent.bachelorDocuments.set(
      bachelorDocuments.concat([{ id: 'temp-upload-1', name: 'new-bachelor.pdf', size: newBachelorTranscript.size }]),
    );
    documentsComponent.onBachelorQueuedFilesChange([newBachelorTranscript]);

    httpClientMock.post.mockReset();
    httpClientMock.post.mockReturnValue(
      of([
        { id: 'bachelor-doc-1', name: 'bachelor.pdf', size: 100 },
        { id: 'uploaded-doc-1', name: 'new-bachelor.pdf', size: newBachelorTranscript.size },
      ]),
    );

    await documentsComponent.saveAll();

    expect(httpClientMock.post).toHaveBeenCalledWith('/api/applicants/profile/documents/BACHELOR_TRANSCRIPT', expect.any(FormData));
    const [, requestBody] = httpClientMock.post.mock.calls[0];
    expect((requestBody as FormData).get('files')).toBe(newBachelorTranscript);
  });

  it('renames persisted applicant documents when settings documents are saved', async () => {
    const documentsComponent = await createDocumentsComponent();
    const bachelorDocuments = documentsComponent.bachelorDocuments();
    expect(bachelorDocuments).toBeDefined();
    if (!bachelorDocuments || bachelorDocuments.length === 0) {
      throw new Error('Expected initial Bachelor document');
    }

    (bachelorDocuments[0] as Mutable<(typeof bachelorDocuments)[0]>).name = 'bachelor-renamed.pdf';

    await documentsComponent.saveAll();

    expect(applicantApiMock.renameApplicantProfileDocument).toHaveBeenCalledWith('bachelor-doc-1', 'bachelor-renamed.pdf');
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import { ApplicantDTO } from 'app/generated/models/applicant-dto';
import { ApplicationDocumentIdsDTO } from 'app/generated/models/application-document-ids-dto';

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends object ? Mutable<T[P]> : T[P] };
import { PersonalInformationSettingsComponent } from 'app/shared/settings/personal-information-settings';
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

  const applicationResourceServiceMock = createApplicantResourceApiMock();

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
    applicationResourceServiceMock.getApplicantProfile.mockReturnValue(of(baseProfile));
    applicationResourceServiceMock.getApplicantProfileDocumentIds.mockReturnValue(of(baseDocumentIds));
    applicationResourceServiceMock.updateApplicantPersonalInformation.mockReturnValue(of(baseProfile));
    applicationResourceServiceMock.updateApplicantDocumentSettings.mockReturnValue(of(baseProfile));
    applicationResourceServiceMock.uploadApplicantDocuments.mockReturnValue(of([]));
    applicationResourceServiceMock.deleteApplicantProfileDocument.mockReturnValue(of(undefined));
    applicationResourceServiceMock.renameApplicantProfileDocument.mockReturnValue(of(undefined));
    httpClientMock.post.mockReset();
    httpClientMock.post.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ApplicantResourceApi, useValue: applicationResourceServiceMock },
        { provide: HttpClient, useValue: httpClientMock },
        provideDialogServiceMock(dialogServiceMock),
        provideAccountServiceMock(accountServiceMock),
        provideToastServiceMock(toastServiceMock),
        provideFontAwesomeTesting(),
      ],
    });
  });

  it('documents save uses the latest personal information saved in another tab', async () => {
    const profileAfterPersonalSave = cloneValue(baseProfile);
    profileAfterPersonalSave.user!.firstName = 'Grace';
    const profileAfterBothSaves = cloneValue(profileAfterPersonalSave);
    profileAfterBothSaves.bachelorGrade = '1.0';

    applicationResourceServiceMock.getApplicantProfile.mockReset();
    applicationResourceServiceMock.getApplicantProfile
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(profileAfterPersonalSave))
      .mockReturnValueOnce(of(profileAfterBothSaves));
    applicationResourceServiceMock.getApplicantProfileDocumentIds.mockReset();
    applicationResourceServiceMock.getApplicantProfileDocumentIds.mockReturnValue(of(baseDocumentIds));
    applicationResourceServiceMock.updateApplicantPersonalInformation.mockReset();
    applicationResourceServiceMock.updateApplicantDocumentSettings.mockReset();
    applicationResourceServiceMock.updateApplicantPersonalInformation
      .mockReturnValueOnce(of(profileAfterPersonalSave))
      .mockReturnValueOnce(of(profileAfterPersonalSave));
    applicationResourceServiceMock.updateApplicantDocumentSettings.mockReturnValueOnce(of(profileAfterBothSaves));

    const personalComponent = TestBed.runInInjectionContext(() => new PersonalInformationSettingsComponent());
    await personalComponent.loadPersonalInformation();

    const documentsComponent = await createDocumentsComponent();

    const updatedPersonalData = cloneValue(personalComponent.data());
    updatedPersonalData.firstName = 'Grace';
    personalComponent.data.set(updatedPersonalData);
    documentsComponent.form.patchValue({
      bachelorGrade: '1.0',
    });

    await personalComponent.onSave();
    await documentsComponent.saveAll();

    expect(applicationResourceServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          userId: accountServiceMock.userId,
        }),
        bachelorGrade: '1.0',
      }),
    );
    expect(applicationResourceServiceMock.updateApplicantPersonalInformation).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          firstName: 'Grace',
        }),
      }),
    );
  });

  it('personal information save uses the latest document settings saved in another tab', async () => {
    const profileAfterDocumentsSave = cloneValue(baseProfile);
    profileAfterDocumentsSave.bachelorGrade = '1.0';
    const profileAfterBothSaves = cloneValue(profileAfterDocumentsSave);
    profileAfterBothSaves.user!.firstName = 'Grace';

    applicationResourceServiceMock.getApplicantProfile.mockReset();
    applicationResourceServiceMock.getApplicantProfile
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(baseProfile))
      .mockReturnValueOnce(of(profileAfterDocumentsSave))
      .mockReturnValueOnce(of(profileAfterDocumentsSave));
    applicationResourceServiceMock.getApplicantProfileDocumentIds.mockReset();
    applicationResourceServiceMock.getApplicantProfileDocumentIds.mockReturnValue(of(baseDocumentIds));
    applicationResourceServiceMock.updateApplicantDocumentSettings.mockReset();
    applicationResourceServiceMock.updateApplicantPersonalInformation.mockReset();
    applicationResourceServiceMock.updateApplicantDocumentSettings
      .mockReturnValueOnce(of(profileAfterDocumentsSave))
      .mockReturnValueOnce(of(profileAfterDocumentsSave));
    applicationResourceServiceMock.updateApplicantPersonalInformation.mockReturnValueOnce(of(profileAfterBothSaves));

    const documentsComponent = await createDocumentsComponent();

    const personalComponent = TestBed.runInInjectionContext(() => new PersonalInformationSettingsComponent());
    await personalComponent.loadPersonalInformation();

    documentsComponent.form.patchValue({
      bachelorGrade: '1.0',
    });
    const updatedPersonalData = cloneValue(personalComponent.data());
    updatedPersonalData.firstName = 'Grace';
    personalComponent.data.set(updatedPersonalData);

    await documentsComponent.saveAll();
    await personalComponent.onSave();

    expect(applicationResourceServiceMock.updateApplicantPersonalInformation).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          firstName: 'Grace',
        }),
      }),
    );
    expect(applicationResourceServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledWith(
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

    applicationResourceServiceMock.getApplicantProfile.mockReset();
    applicationResourceServiceMock.getApplicantProfile.mockReturnValue(of(profileWithManualLimits));

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

  it('preserves disabled email field when another personal information field changes', async () => {
    const fixture = TestBed.createComponent(PersonalInformationSettingsComponent);
    const personalComponent = fixture.componentInstance;
    await personalComponent.loadPersonalInformation();
    fixture.detectChanges();

    const form = personalComponent.personalInfoForm();
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
    const cvDocuments = documentsComponent.cvDocuments();
    expect(cvDocuments).toBeDefined();
    if (!cvDocuments || cvDocuments.length === 0) {
      throw new Error('Expected initial CV document');
    }

    (cvDocuments[0] as Mutable<typeof cvDocuments[0]>).name = 'cv-renamed.pdf';

    await documentsComponent.saveAll();

    expect(applicationResourceServiceMock.renameApplicantProfileDocument).toHaveBeenCalledWith('cv-doc-1', 'cv-renamed.pdf');
  });
});

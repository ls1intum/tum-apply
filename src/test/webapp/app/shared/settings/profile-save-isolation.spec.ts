import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { ApplicantDTO } from 'app/generated/model/applicantDTO';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/applicationDocumentIdsDTO';
import { PersonalInformationSettingsComponent } from 'app/shared/settings/personal-information-settings';
import { SettingsDocumentsComponent } from 'app/shared/settings/settings-documents/settings-documents.component';
import { DialogService } from 'primeng/dynamicdialog';

import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';

describe('Profile save isolation', () => {
  const baseProfile: ApplicantDTO = {
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

  const baseDocumentIds: ApplicationDocumentIdsDTO = {
    bachelorDocumentDictionaryIds: [{ id: 'bachelor-doc-1', name: 'bachelor.pdf', size: 100 }],
    masterDocumentDictionaryIds: [{ id: 'master-doc-1', name: 'master.pdf', size: 100 }],
    cvDocumentDictionaryId: { id: 'cv-doc-1', name: 'cv.pdf', size: 100 },
    referenceDocumentDictionaryIds: [{ id: 'reference-doc-1', name: 'reference.pdf', size: 100 }],
  };

  const applicationResourceServiceMock = {
    getApplicantProfile: vi.fn(),
    getApplicantProfileDocumentIds: vi.fn(),
    updateApplicantPersonalInformation: vi.fn(),
    updateApplicantDocumentSettings: vi.fn(),
    uploadApplicantDocuments: vi.fn(),
    deleteApplicantProfileDocument: vi.fn(),
    renameApplicantProfileDocument: vi.fn(),
  };

  const accountServiceMock = createAccountServiceMock();
  const toastServiceMock = createToastServiceMock();
  const dialogServiceMock = {
    open: vi.fn(),
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

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ApplicationResourceApiService, useValue: applicationResourceServiceMock },
        { provide: DialogService, useValue: dialogServiceMock },
        provideAccountServiceMock(accountServiceMock),
        provideToastServiceMock(toastServiceMock),
      ],
    });
  });

  it('documents save uses the latest personal information saved in another tab', async () => {
    const profileAfterPersonalSave: ApplicantDTO = {
      ...baseProfile,
      user: {
        ...baseProfile.user,
        firstName: 'Grace',
      },
    };
    const profileAfterBothSaves: ApplicantDTO = {
      ...profileAfterPersonalSave,
      bachelorGrade: '1.0',
    };

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

    const documentsComponent = TestBed.runInInjectionContext(() => new SettingsDocumentsComponent());
    await documentsComponent['loadProfile']();

    personalComponent.data.set({
      ...personalComponent.data(),
      firstName: 'Grace',
    });
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
    const profileAfterDocumentsSave: ApplicantDTO = {
      ...baseProfile,
      bachelorGrade: '1.0',
    };
    const profileAfterBothSaves: ApplicantDTO = {
      ...profileAfterDocumentsSave,
      user: {
        ...profileAfterDocumentsSave.user,
        firstName: 'Grace',
      },
    };

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

    const documentsComponent = TestBed.runInInjectionContext(() => new SettingsDocumentsComponent());
    await documentsComponent['loadProfile']();

    const personalComponent = TestBed.runInInjectionContext(() => new PersonalInformationSettingsComponent());
    await personalComponent.loadPersonalInformation();

    documentsComponent.form.patchValue({
      bachelorGrade: '1.0',
    });
    personalComponent.data.set({
      ...personalComponent.data(),
      firstName: 'Grace',
    });

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
});

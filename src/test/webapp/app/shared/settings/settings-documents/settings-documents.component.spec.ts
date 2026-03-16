import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { ApplicantDTO } from 'app/generated/model/applicantDTO';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/applicationDocumentIdsDTO';
import { SettingsDocumentsComponent } from 'app/shared/settings/settings-documents/settings-documents.component';
import { createApplicantResourceApiServiceMock, provideApplicantResourceApiServiceMock } from 'util/applicant-resource-api.service.mock';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';
import { createTranslateServiceMock, provideTranslateMock } from '../../../../util/translate.mock';
import { createDialogServiceMock, provideDialogServiceMock } from '../../../../util/dialog.service.mock';
import { createHttpClientMock, provideHttpClientMock } from '../../../../util/http-client.mock';
import { GradingScaleEditDialogComponent } from 'app/application/application-creation/application-creation-page2/grading-scale-edit-dialog/grading-scale-edit-dialog';

describe('SettingsDocumentsComponent', () => {
  type SettingsDocumentsComponentWithLoadProfile = SettingsDocumentsComponent & {
    loadProfile: () => Promise<void>;
  };

  const createProfile = (): ApplicantDTO => ({
    user: {
      userId: 'user-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '+491234567',
      gender: 'female',
      nationality: 'de',
      birthday: '1990-12-10',
      website: 'https://ada.example.com',
      linkedinUrl: 'https://linkedin.com/in/ada',
    },
    street: 'Main Street 1',
    postalCode: '80333',
    city: 'Munich',
    country: 'de',
    bachelorDegreeName: 'BSc Computer Science',
    bachelorUniversity: 'TUM',
    bachelorGradeUpperLimit: '1.0',
    bachelorGradeLowerLimit: '4.0',
    bachelorGrade: '1.3',
    masterDegreeName: 'MSc Computer Science',
    masterUniversity: 'TUM',
    masterGradeUpperLimit: '1.0',
    masterGradeLowerLimit: '4.0',
    masterGrade: '1.1',
  });

  const createDocumentIds = (): ApplicationDocumentIdsDTO => ({
    bachelorDocumentDictionaryIds: [{ id: 'bachelor-doc-1', name: 'bachelor.pdf', size: 100 }],
    masterDocumentDictionaryIds: [{ id: 'master-doc-1', name: 'master.pdf', size: 100 }],
    cvDocumentDictionaryId: { id: 'cv-doc-1', name: 'cv.pdf', size: 100 },
    referenceDocumentDictionaryIds: [{ id: 'reference-doc-1', name: 'reference.pdf', size: 100 }],
  });

  const createComponent = async (): Promise<SettingsDocumentsComponent> => {
    const prototype = SettingsDocumentsComponent.prototype as SettingsDocumentsComponentWithLoadProfile;
    const originalLoadProfile = prototype.loadProfile;
    let loadProfilePromise: Promise<void> | undefined;
    const loadProfileSpy = vi.spyOn(prototype, 'loadProfile').mockImplementation(function (
      this: SettingsDocumentsComponentWithLoadProfile,
    ) {
      loadProfilePromise = originalLoadProfile.call(this);
      return loadProfilePromise;
    });

    try {
      const component = TestBed.runInInjectionContext(() => new SettingsDocumentsComponent());
      if (loadProfilePromise == null) {
        throw new Error('Expected constructor to trigger loadProfile()');
      }
      await loadProfilePromise;
      return component;
    } finally {
      loadProfileSpy.mockRestore();
    }
  };

  const applicantResourceApiServiceMock = createApplicantResourceApiServiceMock();
  const accountServiceMock = createAccountServiceMock();
  const toastServiceMock = createToastServiceMock();
  const translateServiceMock = createTranslateServiceMock();
  const dialogServiceMock = createDialogServiceMock();
  const httpClientMock = createHttpClientMock();

  beforeEach(() => {
    vi.clearAllMocks();

    accountServiceMock.user.set({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      authorities: [],
    });

    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(of(createProfile()));
    applicantResourceApiServiceMock.getApplicantProfileDocumentIds.mockReturnValue(of(createDocumentIds()));
    applicantResourceApiServiceMock.updateApplicantDocumentSettings.mockReturnValue(of(createProfile()));
    applicantResourceApiServiceMock.deleteApplicantProfileDocument.mockReturnValue(of(undefined));
    applicantResourceApiServiceMock.renameApplicantProfileDocument.mockReturnValue(of(undefined));
    httpClientMock.post.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideApplicantResourceApiServiceMock(applicantResourceApiServiceMock),
        provideAccountServiceMock(accountServiceMock),
        provideToastServiceMock(toastServiceMock),
        provideTranslateMock(translateServiceMock),
        provideDialogServiceMock(dialogServiceMock),
        provideHttpClientMock(httpClientMock),
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should load profile data and document ids on construction', async () => {
    const component = await createComponent();

    expect(applicantResourceApiServiceMock.getApplicantProfile).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.getApplicantProfileDocumentIds).toHaveBeenCalledOnce();
    expect(component.hasLoaded()).toBe(true);
    expect(component.hasChanges()).toBe(false);
    expect(component.form.getRawValue()).toMatchObject({
      bachelorDegreeName: 'BSc Computer Science',
      masterDegreeName: 'MSc Computer Science',
    });
    expect(component.bachelorDocuments()?.[0]?.id).toBe('bachelor-doc-1');
    expect(component.referenceDocuments()?.[0]?.id).toBe('reference-doc-1');
    expect(component.bachelorGradeLimits()).toEqual({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });
    expect(component.masterGradeLimits()).toEqual({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });
  });

  it('should show an error toast when loading document settings fails', async () => {
    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(throwError(() => new Error('load failed')));

    const component = await createComponent();

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.documents.loadFailed');
    expect(component.hasLoaded()).toBe(false);
  });

  it('should set grade limits to null when the loaded grades are empty', async () => {
    const profile = createProfile();
    profile.bachelorGrade = '';
    profile.bachelorGradeUpperLimit = '';
    profile.bachelorGradeLowerLimit = '';
    profile.masterGrade = '';
    profile.masterGradeUpperLimit = '';
    profile.masterGradeLowerLimit = '';
    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(of(profile));

    const component = await createComponent();

    expect(component.form.controls.bachelorGrade.value).toBe('');
    expect(component.form.controls.masterGrade.value).toBe('');
    expect(component.bachelorGradeLimits()).toBeNull();
    expect(component.masterGradeLimits()).toBeNull();
  });

  it('should map missing profile fields and document ids to empty values on load', async () => {
    const profile: ApplicantDTO = {
      user: {
        userId: 'user-1',
      },
      bachelorDegreeName: undefined,
      bachelorUniversity: undefined,
      bachelorGradeUpperLimit: undefined,
      bachelorGradeLowerLimit: undefined,
      bachelorGrade: undefined,
      masterDegreeName: undefined,
      masterUniversity: undefined,
      masterGradeUpperLimit: undefined,
      masterGradeLowerLimit: undefined,
      masterGrade: undefined,
    };
    const documentIds: ApplicationDocumentIdsDTO = {};
    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(of(profile));
    applicantResourceApiServiceMock.getApplicantProfileDocumentIds.mockReturnValue(of(documentIds));

    const component = await createComponent();

    expect(component.form.getRawValue()).toMatchObject({
      bachelorDegreeName: '',
      masterDegreeName: '',
      bachelorGrade: '',
      masterGrade: '',
    });
    expect(component.bachelorDocuments()).toEqual([]);
    expect(component.referenceDocuments()).toEqual([]);
  });

  it('should detect form and document changes relative to the loaded snapshot', async () => {
    const component = await createComponent();

    component.form.patchValue({
      bachelorDegreeName: 'Updated Degree',
    });

    expect(component.hasFormChanges()).toBe(true);
    expect(component.hasChanges()).toBe(true);

    component.referenceDocuments.set([{ id: 'reference-doc-1', name: 'reference-renamed.pdf', size: 100 }]);

    expect(component.hasDocumentChanges()).toBe(true);
    expect(component.hasChanges()).toBe(true);
  });

  it.each([
    {
      gradeType: 'bachelor' as const,
      currentGrade: '1.3',
      updatedLimits: { upperLimit: '100%', lowerLimit: '60%' },
      expectedFieldValues: { upper: '100%', lower: '60%' },
      getLimits: (component: SettingsDocumentsComponent) => component.bachelorGradeLimits(),
      getFieldValues: (component: SettingsDocumentsComponent) => ({
        upper: component.form.controls.bachelorGradeUpperLimit.value,
        lower: component.form.controls.bachelorGradeLowerLimit.value,
      }),
    },
    {
      gradeType: 'master' as const,
      currentGrade: '1.1',
      updatedLimits: { upperLimit: '110', lowerLimit: '66' },
      expectedFieldValues: { upper: '110', lower: '66' },
      getLimits: (component: SettingsDocumentsComponent) => component.masterGradeLimits(),
      getFieldValues: (component: SettingsDocumentsComponent) => ({
        upper: component.form.controls.masterGradeUpperLimit.value,
        lower: component.form.controls.masterGradeLowerLimit.value,
      }),
    },
  ])(
    'should apply returned grading scale limits for $gradeType grades',
    async ({ gradeType, currentGrade, updatedLimits, expectedFieldValues, getLimits, getFieldValues }) => {
      const dialogCloseSubject = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
      dialogServiceMock.open.mockReturnValue({ onClose: dialogCloseSubject.asObservable() });
      const component = await createComponent();

      component.onChangeGradingScale(gradeType);

      expect(dialogServiceMock.open).toHaveBeenCalledWith(
        GradingScaleEditDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            gradeType,
            currentGrade,
          }),
        }),
      );

      dialogCloseSubject.next(updatedLimits);

      expect(getFieldValues(component)).toEqual(expectedFieldValues);
      expect(getLimits(component)).toEqual(updatedLimits);
    },
  );

  it('should keep master grading scale values unchanged when the dialog closes without a result', async () => {
    const dialogCloseSubject = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
    dialogServiceMock.open.mockReturnValue({
      onClose: dialogCloseSubject.asObservable(),
    });

    const component = await createComponent();
    component.form.patchValue({
      masterGradeUpperLimit: null,
      masterGradeLowerLimit: null,
    });

    component.onChangeGradingScale('master');
    dialogCloseSubject.next(undefined);

    expect(dialogServiceMock.open).toHaveBeenCalledOnce();
    const openCall = dialogServiceMock.open.mock.calls[0];
    expect(openCall[1]).toEqual({
      header: 'entity.applicationPage2.helperText.changeScale',
      width: '40rem',
      style: { background: 'var(--color-background-default)' },
      closable: true,
      draggable: false,
      modal: true,
      data: {
        gradeType: 'master',
        currentGrade: '1.1',
        currentUpperLimit: '',
        currentLowerLimit: '',
      },
    });
    expect(component.form.controls.masterGradeUpperLimit.value).toBeNull();
    expect(component.form.controls.masterGradeLowerLimit.value).toBeNull();
  });

  it.each([
    {
      label: 'bachelor',
      setDetectedGrade: (component: SettingsDocumentsComponent) => component.form.controls.bachelorGrade.setValue('84%'),
      setWarningGrade: (component: SettingsDocumentsComponent) => component.form.controls.bachelorGrade.setValue('12345'),
      getUpperLimit: (component: SettingsDocumentsComponent) => component.form.controls.bachelorGradeUpperLimit.value,
      getLowerLimit: (component: SettingsDocumentsComponent) => component.form.controls.bachelorGradeLowerLimit.value,
      getWarning: (component: SettingsDocumentsComponent) => component.warningTextBachelorGrade(),
    },
    {
      label: 'master',
      setDetectedGrade: (component: SettingsDocumentsComponent) => component.form.controls.masterGrade.setValue('84%'),
      setWarningGrade: (component: SettingsDocumentsComponent) => component.form.controls.masterGrade.setValue('12345'),
      getUpperLimit: (component: SettingsDocumentsComponent) => component.form.controls.masterGradeUpperLimit.value,
      getLowerLimit: (component: SettingsDocumentsComponent) => component.form.controls.masterGradeLowerLimit.value,
      getWarning: (component: SettingsDocumentsComponent) => component.warningTextMasterGrade(),
    },
  ])(
    'should derive limits and warnings for $label grades after debounce',
    async ({ setDetectedGrade, setWarningGrade, getUpperLimit, getLowerLimit, getWarning }) => {
      vi.useFakeTimers();
      const component = await createComponent();

      setDetectedGrade(component);
      await vi.advanceTimersByTimeAsync(600);

      expect({ upper: getUpperLimit(component), lower: getLowerLimit(component) }).toEqual({ upper: '100%', lower: '50%' });

      setWarningGrade(component);
      await vi.advanceTimersByTimeAsync(600);

      expect(getWarning(component)).toBe('entity.applicationPage2.warnText');
    },
  );

  it('should skip saving when there are no changes', async () => {
    const component = await createComponent();
    vi.clearAllMocks();

    await component.saveAll();

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).not.toHaveBeenCalled();
  });

  it('should save document settings with the expected payload and reload state', async () => {
    const component = await createComponent();
    // Ignore the constructor-triggered load calls so the expectations below only
    // describe the save flow itself.
    vi.clearAllMocks();

    component.form.patchValue({
      masterDegreeName: 'Updated Master Degree',
    });

    await component.saveAll();

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ userId: 'user-1' }),
        masterDegreeName: 'Updated Master Degree',
      }),
    );
    expect(applicantResourceApiServiceMock.getApplicantProfile).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.getApplicantProfileDocumentIds).toHaveBeenCalledOnce();
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.documents.saved');
    expect(component.saving()).toBe(false);
  });

  it('should persist document deletions, renames and queued uploads during save', async () => {
    const component = await createComponent();
    vi.clearAllMocks();
    const referenceFile = new File(['reference'], 'new-reference.pdf', { type: 'application/pdf' });

    component.bachelorDocuments.set([]);
    component.referenceDocuments.set([
      { id: 'reference-doc-1', name: 'reference-renamed.pdf', size: 100 },
      { id: 'temp-upload-1', name: 'new-reference.pdf', size: referenceFile.size },
    ]);
    component.onReferenceQueuedFilesChange([referenceFile]);
    // Simulate the upload endpoint returning the real persisted document entry
    // that replaces the temporary placeholder in the UI state.
    httpClientMock.post.mockReturnValue(
      of([
        { id: 'reference-doc-1', name: 'reference-renamed.pdf', size: 100 },
        { id: 'uploaded-reference-1', name: 'new-reference.pdf', size: referenceFile.size },
      ]),
    );

    await component.saveAll();

    expect(applicantResourceApiServiceMock.deleteApplicantProfileDocument).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.deleteApplicantProfileDocument).toHaveBeenCalledWith('bachelor-doc-1');
    expect(applicantResourceApiServiceMock.renameApplicantProfileDocument).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.renameApplicantProfileDocument).toHaveBeenCalledWith('reference-doc-1', 'reference-renamed.pdf');
    expect(httpClientMock.post).toHaveBeenCalledOnce();
    expect(httpClientMock.post).toHaveBeenCalledWith('/api/applicants/profile/documents/REFERENCE', expect.any(FormData));
    const uploadCall = httpClientMock.post.mock.calls[0];
    expect((uploadCall[1] as FormData).get('files')).toBe(referenceFile);
  });

  it('should show an error and skip saving when the loaded user id is missing', async () => {
    const component = await createComponent();
    vi.clearAllMocks();
    accountServiceMock.user.set(undefined);
    component.form.patchValue({
      bachelorDegreeName: 'Updated Degree',
    });

    await component.saveAll();

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).not.toHaveBeenCalled();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.documents.saveFailed');
    expect(component.saving()).toBe(false);
  });

  it('should show an error toast when saving document settings fails', async () => {
    applicantResourceApiServiceMock.updateApplicantDocumentSettings.mockReturnValue(throwError(() => new Error('save failed')));

    const component = await createComponent();
    vi.clearAllMocks();
    applicantResourceApiServiceMock.updateApplicantDocumentSettings.mockReturnValue(throwError(() => new Error('save failed')));
    component.form.patchValue({
      bachelorDegreeName: 'Updated Degree',
    });

    await component.saveAll();

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.documents.saveFailed');
    expect(toastServiceMock.showSuccessKey).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });
});

import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { ApplicantDTO } from 'app/generated/model/applicantDTO';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/applicationDocumentIdsDTO';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { SettingsDocumentsComponent } from 'app/shared/settings/settings-documents/settings-documents.component';
import { createApplicantResourceApiServiceMock, provideApplicantResourceApiServiceMock } from 'util/applicant-resource-api.service.mock';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';
import { createTranslateServiceMock, provideTranslateMock } from '../../../../util/translate.mock';
import { createDialogServiceMock, provideDialogServiceMock } from '../../../../util/dialog.service.mock';
import { createHttpClientMock, provideHttpClientMock } from '../../../../util/http-client.mock';
import { GradingScaleEditDialogComponent } from 'app/application/application-creation/application-creation-page2/grading-scale-edit-dialog/grading-scale-edit-dialog';

describe('SettingsDocumentsComponent', () => {
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

  const flushAsyncWork = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };

  const createComponent = async (): Promise<SettingsDocumentsComponent> => {
    const component = TestBed.runInInjectionContext(() => new SettingsDocumentsComponent());
    await flushAsyncWork();
    return component;
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

  it('should load profile data and document ids on construction', async () => {
    const component = await createComponent();

    expect(applicantResourceApiServiceMock.getApplicantProfile).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.getApplicantProfile).toHaveBeenCalledWith('body', false, { transferCache: false });
    expect(applicantResourceApiServiceMock.getApplicantProfileDocumentIds).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.getApplicantProfileDocumentIds).toHaveBeenCalledWith('body', false, { transferCache: false });
    expect(component.hasLoaded()).toBe(true);
    expect(component.hasChanges()).toBe(false);
    expect(component.form.getRawValue()).toEqual({
      bachelorDegreeName: 'BSc Computer Science',
      bachelorDegreeUniversity: 'TUM',
      bachelorGradeUpperLimit: '1.0',
      bachelorGradeLowerLimit: '4.0',
      bachelorGrade: '1.3',
      masterDegreeName: 'MSc Computer Science',
      masterDegreeUniversity: 'TUM',
      masterGradeUpperLimit: '1.0',
      masterGradeLowerLimit: '4.0',
      masterGrade: '1.1',
    });
    expect(component.bachelorDocuments()).toEqual([{ id: 'bachelor-doc-1', name: 'bachelor.pdf', size: 100 }]);
    expect(component.masterDocuments()).toEqual([{ id: 'master-doc-1', name: 'master.pdf', size: 100 }]);
    expect(component.cvDocuments()).toEqual([{ id: 'cv-doc-1', name: 'cv.pdf', size: 100 }]);
    expect(component.referenceDocuments()).toEqual([{ id: 'reference-doc-1', name: 'reference.pdf', size: 100 }]);
    expect(component.bachelorGradeLimits()).toEqual({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });
    expect(component.masterGradeLimits()).toEqual({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });
  });

  it('should report no document changes before the initial profile load has finished', () => {
    const component = TestBed.runInInjectionContext(() => new SettingsDocumentsComponent());

    expect(component.hasLoaded()).toBe(false);
    expect(component.hasDocumentChanges()).toBe(false);
    expect(component.hasChanges()).toBe(false);
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

    expect(component.form.getRawValue()).toEqual({
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
    expect(component.bachelorDocuments()).toEqual([]);
    expect(component.masterDocuments()).toEqual([]);
    expect(component.cvDocuments()).toEqual([]);
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

  it('should open the grading scale dialog for bachelor grades and apply the returned limits', async () => {
    const dialogCloseSubject = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
    dialogServiceMock.open.mockReturnValue({
      onClose: dialogCloseSubject.asObservable(),
    });

    const component = await createComponent();

    component.onChangeGradingScale('bachelor');

    expect(dialogServiceMock.open).toHaveBeenCalledOnce();
    const openCall = dialogServiceMock.open.mock.calls[0];
    expect(openCall[0]).toBe(GradingScaleEditDialogComponent);
    expect(openCall[1]).toEqual({
      header: 'entity.applicationPage2.helperText.changeScale',
      width: '40rem',
      style: { background: 'var(--color-background-default)' },
      closable: true,
      draggable: false,
      modal: true,
      data: {
        gradeType: 'bachelor',
        currentGrade: '1.3',
        currentUpperLimit: '1.0',
        currentLowerLimit: '4.0',
      },
    });

    dialogCloseSubject.next({ upperLimit: '100%', lowerLimit: '60%' });

    expect(component.form.controls.bachelorGradeUpperLimit.value).toBe('100%');
    expect(component.form.controls.bachelorGradeLowerLimit.value).toBe('60%');
    expect(component.bachelorGradeLimits()).toEqual({ upperLimit: '100%', lowerLimit: '60%' });
  });

  it('should open the grading scale dialog for master grades and apply the returned limits', async () => {
    const dialogCloseSubject = new Subject<{ upperLimit: string; lowerLimit: string } | undefined>();
    dialogServiceMock.open.mockReturnValue({
      onClose: dialogCloseSubject.asObservable(),
    });

    const component = await createComponent();

    component.onChangeGradingScale('master');

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
        currentUpperLimit: '1.0',
        currentLowerLimit: '4.0',
      },
    });

    dialogCloseSubject.next({ upperLimit: '110', lowerLimit: '66' });

    expect(component.form.controls.masterGradeUpperLimit.value).toBe('110');
    expect(component.form.controls.masterGradeLowerLimit.value).toBe('66');
    expect(component.masterGradeLimits()).toEqual({ upperLimit: '110', lowerLimit: '66' });
  });

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

  it('should detect bachelor grade limits after the debounce interval', async () => {
    vi.useFakeTimers();

    const component = await createComponent();

    component.form.controls.bachelorGrade.setValue('84%');
    await vi.advanceTimersByTimeAsync(600);

    expect(component.form.controls.bachelorGradeUpperLimit.value).toBe('100%');
    expect(component.form.controls.bachelorGradeLowerLimit.value).toBe('50%');
    expect(component.bachelorGradeLimits()).toEqual({
      upperLimit: '100%',
      lowerLimit: '50%',
      isPercentage: true,
    });

    vi.useRealTimers();
  });

  it('should not recompute grade limits while the initial limits are not set yet', async () => {
    vi.useFakeTimers();

    const component = await createComponent();
    component.hasInitialLimitsSet.set(false);
    component.bachelorGradeLimits.set({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });
    component.masterGradeLimits.set({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });

    component.form.controls.bachelorGrade.setValue('84%');
    component.form.controls.masterGrade.setValue('84%');
    await vi.advanceTimersByTimeAsync(600);

    expect(component.bachelorGradeLimits()).toEqual({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });
    expect(component.masterGradeLimits()).toEqual({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });

    vi.useRealTimers();
  });

  it('should compute helper text for the bachelor grade limits', async () => {
    const component = await createComponent();

    expect(component.helperTextBachelorGrade()).toBe(
      'entity.applicationPage2.helperText.scaleentity.applicationPage2.helperText.gradingScale',
    );
  });

  it('should compute helper text for the master grade limits', async () => {
    const component = await createComponent();

    expect(component.helperTextMasterGrade()).toBe(
      'entity.applicationPage2.helperText.scaleentity.applicationPage2.helperText.gradingScale',
    );
  });

  it('should detect master grade limits after the debounce interval', async () => {
    vi.useFakeTimers();

    const component = await createComponent();

    component.form.controls.masterGrade.setValue('84%');
    await vi.advanceTimersByTimeAsync(600);

    expect(component.form.controls.masterGradeUpperLimit.value).toBe('100%');
    expect(component.form.controls.masterGradeLowerLimit.value).toBe('50%');
    expect(component.masterGradeLimits()).toEqual({
      upperLimit: '100%',
      lowerLimit: '50%',
      isPercentage: true,
    });

    vi.useRealTimers();
  });

  it('should compute a warning text for suspicious bachelor grade input', async () => {
    vi.useFakeTimers();

    const component = await createComponent();

    component.form.controls.bachelorGrade.setValue('12345');
    await vi.advanceTimersByTimeAsync(600);

    expect(component.warningTextBachelorGrade()).toBe('entity.applicationPage2.warnText');

    vi.useRealTimers();
  });

  it('should compute a warning text for suspicious master grade input', async () => {
    vi.useFakeTimers();

    const component = await createComponent();

    component.form.controls.masterGrade.setValue('12345');
    await vi.advanceTimersByTimeAsync(600);

    expect(component.warningTextMasterGrade()).toBe('entity.applicationPage2.warnText');

    vi.useRealTimers();
  });

  it('should store queued files for each document type', async () => {
    const component = await createComponent();
    const bachelorFile = new File(['bachelor'], 'bachelor-new.pdf', { type: 'application/pdf' });
    const masterFile = new File(['master'], 'master-new.pdf', { type: 'application/pdf' });
    const cvFile = new File(['cv'], 'cv-new.pdf', { type: 'application/pdf' });
    const referenceFile = new File(['reference'], 'reference-new.pdf', { type: 'application/pdf' });

    component.onBachelorQueuedFilesChange([bachelorFile]);
    component.onMasterQueuedFilesChange([masterFile]);
    component.onCvQueuedFilesChange([cvFile]);
    component.onReferenceQueuedFilesChange([referenceFile]);

    expect(component.queuedBachelorFiles()).toEqual([bachelorFile]);
    expect(component.queuedMasterFiles()).toEqual([masterFile]);
    expect(component.queuedCvFiles()).toEqual([cvFile]);
    expect(component.queuedReferenceFiles()).toEqual([referenceFile]);
  });

  it('should normalize null form values to empty strings for change tracking', async () => {
    const component = await createComponent();

    component.form.controls.bachelorDegreeName.setValue(null);
    component.form.controls.bachelorDegreeUniversity.setValue(null);
    component.form.controls.bachelorGradeUpperLimit.setValue(null);
    component.form.controls.bachelorGradeLowerLimit.setValue(null);
    component.form.controls.bachelorGrade.setValue(null);
    component.form.controls.masterDegreeName.setValue(null);
    component.form.controls.masterDegreeUniversity.setValue(null);
    component.form.controls.masterGradeUpperLimit.setValue(null);
    component.form.controls.masterGradeLowerLimit.setValue(null);
    component.form.controls.masterGrade.setValue(null);

    expect(component['normalizedFormValue']()).toEqual({
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

  it('should skip saving when there are no changes', async () => {
    const component = await createComponent();
    vi.clearAllMocks();

    await component.saveAll();

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).not.toHaveBeenCalled();
    expect(toastServiceMock.showSuccessKey).not.toHaveBeenCalled();
    expect(toastServiceMock.showErrorKey).not.toHaveBeenCalled();
  });

  it('should save document settings with the expected payload and reload state', async () => {
    const component = await createComponent();
    vi.clearAllMocks();

    component.form.patchValue({
      masterDegreeName: 'Updated Master Degree',
    });

    await component.saveAll();

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledWith({
      user: {
        userId: 'user-1',
        email: undefined,
        firstName: undefined,
        lastName: undefined,
        phoneNumber: undefined,
        gender: undefined,
        nationality: undefined,
        birthday: undefined,
        website: undefined,
        linkedinUrl: undefined,
      },
      street: undefined,
      postalCode: undefined,
      city: undefined,
      country: undefined,
      bachelorDegreeName: 'BSc Computer Science',
      bachelorUniversity: 'TUM',
      bachelorGradeUpperLimit: '1.0',
      bachelorGradeLowerLimit: '4.0',
      bachelorGrade: '1.3',
      masterDegreeName: 'Updated Master Degree',
      masterUniversity: 'TUM',
      masterGradeUpperLimit: '1.0',
      masterGradeLowerLimit: '4.0',
      masterGrade: '1.1',
    });
    expect(applicantResourceApiServiceMock.getApplicantProfile).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.getApplicantProfileDocumentIds).toHaveBeenCalledOnce();
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.documents.saved');
    expect(component.saving()).toBe(false);
  });

  it('should preserve blank document settings fields as empty strings when saving', async () => {
    const component = await createComponent();
    vi.clearAllMocks();

    component.form.patchValue({
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

    await component.saveAll();

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledWith({
      user: {
        userId: 'user-1',
        email: undefined,
        firstName: undefined,
        lastName: undefined,
        phoneNumber: undefined,
        gender: undefined,
        nationality: undefined,
        birthday: undefined,
        website: undefined,
        linkedinUrl: undefined,
      },
      street: undefined,
      postalCode: undefined,
      city: undefined,
      country: undefined,
      bachelorDegreeName: '',
      bachelorUniversity: '',
      bachelorGradeUpperLimit: '',
      bachelorGradeLowerLimit: '',
      bachelorGrade: '',
      masterDegreeName: '',
      masterUniversity: '',
      masterGradeUpperLimit: '',
      masterGradeLowerLimit: '',
      masterGrade: '',
    });
  });

  it('should map null document settings fields to undefined when saving', async () => {
    const component = await createComponent();
    vi.clearAllMocks();

    component.form.controls.bachelorDegreeName.setValue(null);
    component.form.controls.bachelorDegreeUniversity.setValue(null);
    component.form.controls.bachelorGradeUpperLimit.setValue(null);
    component.form.controls.bachelorGradeLowerLimit.setValue(null);
    component.form.controls.bachelorGrade.setValue(null);
    component.form.controls.masterDegreeName.setValue(null);
    component.form.controls.masterDegreeUniversity.setValue(null);
    component.form.controls.masterGradeUpperLimit.setValue(null);
    component.form.controls.masterGradeLowerLimit.setValue(null);
    component.form.controls.masterGrade.setValue(null);

    await component.saveAll();

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledWith({
      user: {
        userId: 'user-1',
        email: undefined,
        firstName: undefined,
        lastName: undefined,
        phoneNumber: undefined,
        gender: undefined,
        nationality: undefined,
        birthday: undefined,
        website: undefined,
        linkedinUrl: undefined,
      },
      street: undefined,
      postalCode: undefined,
      city: undefined,
      country: undefined,
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
    });
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
    httpClientMock.post.mockReturnValue(
      of([
        { id: 'reference-doc-1', name: 'reference-renamed.pdf', size: 100 },
        { id: 'uploaded-reference-1', name: 'new-reference.pdf', size: referenceFile.size },
      ]),
    );

    await component.saveAll();

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledOnce();
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
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
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

    expect(applicantResourceApiServiceMock.updateApplicantDocumentSettings).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.documents.saveFailed');
    expect(toastServiceMock.showSuccessKey).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });
});

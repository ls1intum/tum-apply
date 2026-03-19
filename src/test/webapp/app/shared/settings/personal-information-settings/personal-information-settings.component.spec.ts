import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { ApplicantDTO } from 'app/generated/model/applicantDTO';
import { PersonalInformationData, PersonalInformationSettingsComponent } from 'app/shared/settings/personal-information-settings';
import { createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from 'util/toast-service.mock';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import {
  createApplicantResourceApiServiceMock,
  provideApplicantResourceApiServiceMock,
} from 'util/applicant-resource-api.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('PersonalInformationSettingsComponent', () => {
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
    bachelorGradeUpperLimit: '1.0',
    bachelorGradeLowerLimit: '4.0',
    bachelorGrade: '1.3',
    bachelorUniversity: 'TUM',
    masterDegreeName: 'MSc Computer Science',
    masterGradeUpperLimit: '1.0',
    masterGradeLowerLimit: '4.0',
    masterGrade: '1.1',
    masterUniversity: 'TUM',
  });

  const flushAsyncWork = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const createComponent = async (): Promise<PersonalInformationSettingsComponent> => {
    const component = TestBed.runInInjectionContext(() => new PersonalInformationSettingsComponent());
    await flushAsyncWork();
    return component;
  };

  const applicantResourceApiServiceMock = createApplicantResourceApiServiceMock();
  const accountServiceMock = createAccountServiceMock();
  const toastServiceMock = createToastServiceMock();
  const translateServiceMock = createTranslateServiceMock();
  const instantMock = vi.mocked(translateServiceMock.instant);

  beforeEach(() => {
    vi.clearAllMocks();
    accountServiceMock.user.set({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      authorities: [],
    });
    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(of(createProfile()));
    applicantResourceApiServiceMock.updateApplicantPersonalInformation.mockReturnValue(of(createProfile()));

    instantMock.mockReset();
    instantMock.mockImplementation((key: string | string[]) => (Array.isArray(key) ? key.join(',') : key));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideApplicantResourceApiServiceMock(applicantResourceApiServiceMock),
        provideAccountServiceMock(accountServiceMock),
        provideToastServiceMock(toastServiceMock),
        provideTranslateMock(translateServiceMock),
        provideFontAwesomeTesting(),
      ],
    });
  });

  it('should load and map the applicant profile on construction', async () => {
    const component = await createComponent();

    expect(applicantResourceApiServiceMock.getApplicantProfile).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.getApplicantProfile).toHaveBeenCalledWith('body', false, { transferCache: false });
    expect(component.loadedProfile()).toEqual(createProfile());
    expect(component.data()).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '+491234567',
      gender: { value: 'female', name: 'genders.female' },
      nationality: { value: 'de', name: 'nationalities.de' },
      dateOfBirth: '1990-12-10',
      website: 'https://ada.example.com',
      linkedIn: 'https://linkedin.com/in/ada',
      street: 'Main Street 1',
      city: 'Munich',
      country: { value: 'de', name: 'countries.de' },
      postcode: '80333',
    });
    expect(component.initialDataSnapshot()).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '+491234567',
      gender: 'female',
      nationality: 'de',
      dateOfBirth: '1990-12-10',
      website: 'https://ada.example.com',
      linkedIn: 'https://linkedin.com/in/ada',
      street: 'Main Street 1',
      city: 'Munich',
      country: 'de',
      postcode: '80333',
    });
    expect(component.hasChanges()).toBe(false);
  });

  it('should keep hasChanges false before the initial snapshot is loaded', async () => {
    const profileSubject = new Subject<ApplicantDTO>();
    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(profileSubject.asObservable());

    const component = TestBed.runInInjectionContext(() => new PersonalInformationSettingsComponent());

    expect(component.initialDataSnapshot()).toBeUndefined();
    expect(component.hasChanges()).toBe(false);

    profileSubject.next(createProfile());
    profileSubject.complete();
    await flushAsyncWork();

    expect(component.initialDataSnapshot()).toBeDefined();
    expect(component.hasChanges()).toBe(false);
  });

  it('should show an error toast when loading personal information fails', async () => {
    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(throwError(() => new Error('load failed')));

    const component = await createComponent();

    expect(applicantResourceApiServiceMock.getApplicantProfile).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.personalInformation.loadFailed');
    expect(component.loadedProfile()).toBeUndefined();
  });

  it('should map missing optional profile fields to undefined or empty strings', async () => {
    const profile = createProfile();
    if (profile.user) {
      profile.user.firstName = undefined;
      profile.user.lastName = undefined;
      profile.user.email = undefined;
      profile.user.phoneNumber = undefined;
      profile.user.gender = undefined;
      profile.user.nationality = undefined;
      profile.user.birthday = undefined;
      profile.user.website = undefined;
      profile.user.linkedinUrl = undefined;
    }
    profile.street = undefined;
    profile.postalCode = undefined;
    profile.city = undefined;
    profile.country = undefined;

    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(of(profile));

    const component = await createComponent();

    expect(component.data()).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      gender: undefined,
      nationality: undefined,
      dateOfBirth: '',
      website: '',
      linkedIn: '',
      street: '',
      city: '',
      country: undefined,
      postcode: '',
    });
    expect(component.initialDataSnapshot()).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      gender: undefined,
      nationality: undefined,
      dateOfBirth: '',
      website: '',
      linkedIn: '',
      street: '',
      city: '',
      country: undefined,
      postcode: '',
    });
  });

  it('should preserve undefined select values when syncing other form changes', async () => {
    const profile = createProfile();
    if (profile.user) {
      profile.user.gender = undefined;
      profile.user.nationality = undefined;
    }

    applicantResourceApiServiceMock.getApplicantProfile.mockReturnValue(of(profile));

    const fixture = TestBed.createComponent(PersonalInformationSettingsComponent);
    const component = fixture.componentInstance;
    await flushAsyncWork();
    fixture.detectChanges();

    const form = component.personalInfoForm();
    form.controls.firstName.setValue('Grace');
    await flushAsyncWork();

    expect(component.data().firstName).toBe('Grace');
    expect(component.data().gender).toBeUndefined();
    expect(component.data().nationality).toBeUndefined();
  });

  it('should translate and sort country and nationality options', async () => {
    instantMock.mockImplementation((key: string | string[]) => {
      if (Array.isArray(key)) {
        return key.join(',');
      }
      if (key === 'countries.de') {
        return 'Bravo';
      }
      if (key === 'countries.at') {
        return 'Alpha';
      }
      if (key === 'nationalities.de') {
        return 'Bravo';
      }
      if (key === 'nationalities.at') {
        return 'Alpha';
      }
      return `zz-${key}`;
    });

    const component = await createComponent();
    const countries = component.selectCountriesLocal();
    const nationalities = component.selectNationalityComputed();

    expect(countries[0]).toEqual({ value: 'at', name: 'Alpha' });
    expect(countries[1]).toEqual({ value: 'de', name: 'Bravo' });
    expect(nationalities[0]).toEqual({ value: 'at', name: 'Alpha' });
    expect(nationalities[1]).toEqual({ value: 'de', name: 'Bravo' });
  });

  it('should keep the email control disabled in personal information settings', async () => {
    const component = await createComponent();

    expect(component.disabledEmail).toBe(true);
    expect(component.personalInfoForm().controls.email.disabled).toBe(true);
  });

  it('should sync form changes into component state and validation status', async () => {
    const fixture = TestBed.createComponent(PersonalInformationSettingsComponent);
    const component = fixture.componentInstance;
    await flushAsyncWork();
    fixture.detectChanges();
    const form = component.personalInfoForm();

    form.controls.firstName.setValue('Grace');
    await flushAsyncWork();
    expect(component.data().firstName).toBe('Grace');

    component.updateSelect('country', { value: 'DE', name: 'countries.DE' });
    await flushAsyncWork();

    const postcodeForm = component.personalInfoForm();
    postcodeForm.controls.postcode.setValue('invalid-postcode');
    await flushAsyncWork();
    expect(postcodeForm.valid).toBe(false);

    postcodeForm.controls.postcode.setValue('80333');
    await flushAsyncWork();
    expect(postcodeForm.valid).toBe(true);
  });

  it('should update date and select fields and track unsaved changes', async () => {
    const component = await createComponent();
    const updatedData: PersonalInformationData = structuredClone(component.data());

    updatedData.city = 'Berlin';
    component.data.set(updatedData);
    expect(component.hasChanges()).toBe(true);

    component.setDateOfBirth('1991-01-01');
    expect(component.data().dateOfBirth).toBe('1991-01-01');

    component.setDateOfBirth(undefined);
    expect(component.data().dateOfBirth).toBe('');

    component.updateSelect('gender', { value: 'other', name: 'genders.other' });
    expect(component.data().gender).toEqual({ value: 'other', name: 'genders.other' });

    component.updateSelect('country', undefined);
    expect(component.data().country).toBeUndefined();
  });

  it('should save personal information with the expected payload and reset change tracking', async () => {
    const updatedProfile = createProfile();
    if (updatedProfile.user) {
      updatedProfile.user.firstName = 'Grace';
      updatedProfile.user.email = undefined;
      updatedProfile.user.phoneNumber = undefined;
      updatedProfile.user.nationality = undefined;
      updatedProfile.user.birthday = undefined;
      updatedProfile.user.website = undefined;
      updatedProfile.user.linkedinUrl = undefined;
    }
    updatedProfile.street = undefined;
    updatedProfile.postalCode = undefined;
    updatedProfile.city = 'Berlin';
    updatedProfile.country = 'DE';

    applicantResourceApiServiceMock.updateApplicantPersonalInformation.mockReturnValue(of(updatedProfile));

    const component = await createComponent();
    vi.clearAllMocks();

    const updatedData: PersonalInformationData = structuredClone(component.data());
    updatedData.firstName = 'Grace';
    updatedData.email = '';
    updatedData.phoneNumber = '';
    updatedData.nationality = undefined;
    updatedData.dateOfBirth = '';
    updatedData.website = '';
    updatedData.linkedIn = '';
    updatedData.street = '';
    updatedData.postcode = '';
    updatedData.city = 'Berlin';
    updatedData.country = { value: 'DE', name: 'countries.DE' };
    component.data.set(updatedData);

    await component.onSave();

    expect(applicantResourceApiServiceMock.updateApplicantPersonalInformation).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.updateApplicantPersonalInformation).toHaveBeenCalledWith({
      user: {
        userId: 'user-1',
        email: undefined,
        firstName: 'Grace',
        lastName: 'Lovelace',
        phoneNumber: undefined,
        gender: 'female',
        nationality: undefined,
        birthday: undefined,
        website: undefined,
        linkedinUrl: undefined,
      },
      street: undefined,
      postalCode: undefined,
      city: 'Berlin',
      country: 'DE',
      bachelorDegreeName: undefined,
      bachelorGradeUpperLimit: undefined,
      bachelorGradeLowerLimit: undefined,
      bachelorGrade: undefined,
      bachelorUniversity: undefined,
      masterDegreeName: undefined,
      masterGradeUpperLimit: undefined,
      masterGradeLowerLimit: undefined,
      masterGrade: undefined,
      masterUniversity: undefined,
    });
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.personalInformation.saved');
    expect(toastServiceMock.showErrorKey).not.toHaveBeenCalled();
    expect(component.loadedProfile()).toEqual(updatedProfile);
    expect(component.initialDataSnapshot()).toEqual({
      firstName: 'Grace',
      lastName: 'Lovelace',
      email: '',
      phoneNumber: '',
      gender: 'female',
      nationality: undefined,
      dateOfBirth: '',
      website: '',
      linkedIn: '',
      street: '',
      city: 'Berlin',
      country: 'DE',
      postcode: '',
    });
    expect(component.hasChanges()).toBe(false);
  });

  it('should map blank first name, last name and city to undefined when saving', async () => {
    const component = await createComponent();
    vi.clearAllMocks();

    const updatedData: PersonalInformationData = structuredClone(component.data());
    updatedData.firstName = '';
    updatedData.lastName = '';
    updatedData.city = '';
    component.data.set(updatedData);

    await component.onSave();

    expect(applicantResourceApiServiceMock.updateApplicantPersonalInformation).toHaveBeenCalledOnce();
    expect(applicantResourceApiServiceMock.updateApplicantPersonalInformation).toHaveBeenCalledWith({
      user: {
        userId: 'user-1',
        email: 'ada@example.com',
        firstName: undefined,
        lastName: undefined,
        phoneNumber: '+491234567',
        gender: 'female',
        nationality: 'de',
        birthday: '1990-12-10',
        website: 'https://ada.example.com',
        linkedinUrl: 'https://linkedin.com/in/ada',
      },
      street: 'Main Street 1',
      postalCode: '80333',
      city: undefined,
      country: 'de',
      bachelorDegreeName: undefined,
      bachelorGradeUpperLimit: undefined,
      bachelorGradeLowerLimit: undefined,
      bachelorGrade: undefined,
      bachelorUniversity: undefined,
      masterDegreeName: undefined,
      masterGradeUpperLimit: undefined,
      masterGradeLowerLimit: undefined,
      masterGrade: undefined,
      masterUniversity: undefined,
    });
  });

  it('should show an error and skip saving when the loaded user id is missing', async () => {
    const component = await createComponent();
    vi.clearAllMocks();
    accountServiceMock.user.set(undefined);

    await component.onSave();

    expect(applicantResourceApiServiceMock.updateApplicantPersonalInformation).not.toHaveBeenCalled();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.personalInformation.saveFailed');
  });

  it('should show an error toast when saving personal information fails', async () => {
    applicantResourceApiServiceMock.updateApplicantPersonalInformation.mockReturnValue(throwError(() => new Error('save failed')));

    const component = await createComponent();
    vi.clearAllMocks();

    await component.onSave();

    expect(applicantResourceApiServiceMock.updateApplicantPersonalInformation).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.personalInformation.saveFailed');
    expect(toastServiceMock.showSuccessKey).not.toHaveBeenCalled();
  });

  it('should reload personal information on cancel', async () => {
    const component = await createComponent();
    const loadPersonalInformationSpy = vi.spyOn(component, 'loadPersonalInformation').mockResolvedValue();

    await component.onCancel();

    expect(loadPersonalInformationSpy).toHaveBeenCalledOnce();
  });
});

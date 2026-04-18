import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { ApplicantDTO } from 'app/generated/model/applicant-dto';
import { ApplicationInformationData, ApplicationInformationSettingsComponent } from 'app/shared/settings/application-information-settings';
import { createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from 'util/toast-service.mock';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { createApplicantResourceApiMock, provideApplicantResourceApiMock } from 'util/applicant-resource-api.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends object ? Mutable<T[P]> : T[P] };

describe('ApplicationInformationSettingsComponent', () => {
  const createProfile = (): Mutable<ApplicantDTO> => ({
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

  const createComponent = async (): Promise<ApplicationInformationSettingsComponent> => {
    const component = TestBed.runInInjectionContext(() => new ApplicationInformationSettingsComponent());
    await flushAsyncWork();
    return component;
  };

  const applicantApiMock = createApplicantResourceApiMock();
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
    applicantApiMock.getApplicantProfile.mockReturnValue(of(createProfile()));
    applicantApiMock.updateApplicantPersonalInformation.mockReturnValue(of(createProfile()));

    instantMock.mockReset();
    instantMock.mockImplementation((key: string | string[]) => (Array.isArray(key) ? key.join(',') : key));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideApplicantResourceApiMock(applicantApiMock),
        provideAccountServiceMock(accountServiceMock),
        provideToastServiceMock(toastServiceMock),
        provideTranslateMock(translateServiceMock),
        provideFontAwesomeTesting(),
      ],
    });
  });

  describe('loading profile', () => {
    it('should load and map the applicant profile on construction', async () => {
      const component = await createComponent();

      expect(applicantApiMock.getApplicantProfile).toHaveBeenCalledOnce();
      expect(applicantApiMock.getApplicantProfile).toHaveBeenCalledWith();
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

    it('should show an error toast when loading application information fails', async () => {
      applicantApiMock.getApplicantProfile.mockReturnValue(throwError(() => new Error('load failed')));

      const component = await createComponent();

      expect(applicantApiMock.getApplicantProfile).toHaveBeenCalledOnce();
      expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.applicationInformation.loadFailed');
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

      applicantApiMock.getApplicantProfile.mockReturnValue(of(profile));

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
  });

  describe('option lists', () => {
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
  });

  describe('form behavior', () => {
    it('should update date and select fields', async () => {
      const component = await createComponent();

      component.setDateOfBirth('1991-01-01');
      expect(component.data().dateOfBirth).toBe('1991-01-01');

      component.setDateOfBirth(undefined);
      expect(component.data().dateOfBirth).toBe('');

      component.updateSelect('gender', { value: 'other', name: 'genders.other' });
      expect(component.data().gender).toEqual({ value: 'other', name: 'genders.other' });

      component.updateSelect('country', undefined);
      expect(component.data().country).toBeUndefined();
    });
  });

  describe('change tracking', () => {
    it('should mark the component as changed when data differs from the initial snapshot', async () => {
      const component = await createComponent();
      expect(component.hasChanges()).toBe(false);

      const originalData: ApplicationInformationData = structuredClone(component.data());
      const updatedData: ApplicationInformationData = structuredClone(component.data());
      updatedData.city = 'Berlin';
      component.data.set(updatedData);

      expect(component.hasChanges()).toBe(true);

      component.data.set(originalData);

      expect(component.hasChanges()).toBe(false);
    });
  });

  describe('saving', () => {
    it('should save application information with the expected payload and reset change tracking', async () => {
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

      applicantApiMock.updateApplicantPersonalInformation.mockReturnValue(of(updatedProfile));

      const component = await createComponent();
      vi.clearAllMocks();

      const updatedData: ApplicationInformationData = structuredClone(component.data());
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

      expect(applicantApiMock.updateApplicantPersonalInformation).toHaveBeenCalledOnce();
      expect(applicantApiMock.updateApplicantPersonalInformation).toHaveBeenCalledWith({
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
      expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.applicationInformation.saved');
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

      const updatedData: ApplicationInformationData = structuredClone(component.data());
      updatedData.firstName = '';
      updatedData.lastName = '';
      updatedData.city = '';
      component.data.set(updatedData);

      await component.onSave();

      expect(applicantApiMock.updateApplicantPersonalInformation).toHaveBeenCalledOnce();
      expect(applicantApiMock.updateApplicantPersonalInformation).toHaveBeenCalledWith({
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

    it('should show an error toast when saving application information fails', async () => {
      applicantApiMock.updateApplicantPersonalInformation.mockReturnValue(throwError(() => new Error('save failed')));

      const component = await createComponent();
      vi.clearAllMocks();

      await component.onSave();

      expect(applicantApiMock.updateApplicantPersonalInformation).toHaveBeenCalledOnce();
      expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.applicationInformation.saveFailed');
      expect(toastServiceMock.showSuccessKey).not.toHaveBeenCalled();
    });
  });
});

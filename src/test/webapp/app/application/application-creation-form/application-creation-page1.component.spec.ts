import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage1Component, {
  getPage1FromApplication,
  selectLanguage,
} from '../../../../../main/webapp/app/application/application-creation/application-creation-page1/application-creation-page1.component';
import { postalCodeValidator } from '../../../../../main/webapp/app/shared/validators/custom-validators';
import { selectGender } from '../../../../../main/webapp/app/shared/constants/genders';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AccountService } from 'app/core/auth/account.service';
import { AbstractControl } from '@angular/forms';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';

describe('ApplicationPage1Component', () => {
  let accountService: Pick<AccountService, 'signedIn'>;
  let fixture: ComponentFixture<ApplicationCreationPage1Component>;
  let comp: ApplicationCreationPage1Component;
  beforeEach(async () => {
    accountService = {
      signedIn: signal<boolean>(true),
    };
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage1Component],
      providers: [
        { provide: AccountService, useValue: accountService },
        provideRouter([]),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationCreationPage1Component);
    comp = fixture.componentInstance;
    comp.data.set({
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
    fixture.detectChanges();
  });

  it('should create the component and initial form is invalid', () => {
    expect(comp).toBeTruthy();
    const form = comp.page1Form();
    expect(form).toBeDefined();
    expect(form.valid).toBe(false);
  });

  it('should become valid when all required fields are filled and postal code passes validation', () => {
    const countryOption = { value: 'DE', name: 'Germany' };
    comp.data.set({
      ...comp.data(),
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      street: '',
      city: '',
      country: countryOption,
      postcode: '',
      gender: undefined,
      nationality: undefined,
      dateOfBirth: '',
      website: '',
      linkedIn: '',
    });

    const form = comp.page1Form();

    // Set required values
    form.controls.firstName.setValue('Alice');
    form.controls.lastName.setValue('Smith');
    form.controls.email.setValue('alice@example.com');
    form.controls.phoneNumber.setValue('123456');
    form.controls.street.setValue('Main St');
    form.controls.city.setValue('Munich');
    form.controls.postcode.setValue('80331'); // Valid German postcode

    form.updateValueAndValidity();

    expect(form.valid).toBe(true);
  });

  it('should mark invalidPostalCode error when country is set and postal code is invalid', () => {
    const form = comp.page1Form();
    form.controls.firstName.setValue('Alice');
    form.controls.lastName.setValue('Smith');
    form.controls.email.setValue('alice@example.com');
    form.controls.phoneNumber.setValue('123456');
    form.controls.street.setValue('Main St');
    form.controls.city.setValue('Munich');

    const countryOption = { value: 'DE', name: 'Germany' };
    comp.data.set({ ...comp.data(), country: countryOption });

    form.controls.postcode.setValue('987877');
    form.updateValueAndValidity();

    expect(form.valid).toBe(false);
    expect(form.controls.postcode.errors).toHaveProperty('invalidPostalCode');
  });

  it('getPage1FromApplication maps fields properly', () => {
    const fakeApp: ApplicationForApplicantDTO = {
      applicant: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '9999',
          gender: 'male',
          nationality: 'us',
          birthday: '1990-01-01',
          website: 'https://site.com',
          linkedinUrl: 'https://li.com',
        },
        street: 'Street 1',
        city: 'CityX',
        country: 'us',
        postalCode: '12345',
      },
      applicationState: 'SAVED',
      job: {
        jobId: '2345',
        professorName: 'Professor Name',
        location: 'Garching',
        title: 'Example Job',
      },
    };

    const page1 = getPage1FromApplication(fakeApp);
    expect(page1.firstName).toBe('John');
    expect(page1.gender).toEqual(selectGender.find((g: any) => g.value === 'male'));
    expect(page1.country?.value).toBe('us');
  });

  it('should emit changed and valid when form changes', () => {
    const form = comp.page1Form();
    const changedSpy = vi.fn();
    const validSpy = vi.fn();
    comp.changed.subscribe(changedSpy);
    comp.valid.subscribe(validSpy);
    form.controls.firstName.setValue('Bob');
    expect(changedSpy).toHaveBeenCalled();
    expect(validSpy).toHaveBeenCalled();
  });

  it('setDateOfBirth should update data and emit changed', () => {
    const changedSpy = vi.fn();
    comp.changed.subscribe(changedSpy);

    comp.setDateOfBirth('2000-12-31');
    expect(comp.data().dateOfBirth).toBe('2000-12-31');
    expect(changedSpy).toHaveBeenCalled();
  });

  it('updateSelect should update select fields and emit changed', () => {
    const changedSpy = vi.fn();
    comp.changed.subscribe(changedSpy);

    const nationalityOption = { value: 'FR', name: 'France' };
    comp.updateSelect('nationality', nationalityOption);
    expect(comp.data().nationality).toBe(nationalityOption);
    expect(changedSpy).toHaveBeenCalled();
  });

  it('should not return an error when country is undefined in postalCodeValidator', () => {
    const validator = postalCodeValidator(() => undefined);
    const control = { value: '12345' } as AbstractControl;
    const result = validator(control);
    expect(result).toEqual({}); // No validation error
  });

  it('should not return an error when postal code is empty', () => {
    const validator = postalCodeValidator(() => 'DE');
    const control = { value: '' } as AbstractControl;
    const result = validator(control);
    expect(result).toEqual({}); // No error when value is empty
  });

  it('should return an error when country code is invalid or unsupported', () => {
    const validator = postalCodeValidator(() => 'ZZ'); // ZZ is unsupported
    const control = { value: '12345' } as AbstractControl;
    const result = validator(control);
    expect(result).toEqual({ invalidPostalCode: 'entity.applicationPage1.validation.postalCode' });
  });

  it('updateSelect should allow setting undefined value', () => {
    const changedSpy = vi.fn();
    comp.changed.subscribe(changedSpy);
    comp.updateSelect('gender', undefined);
    expect(comp.data().gender).toBeUndefined();
    expect(changedSpy).toHaveBeenCalled();
  });

  it('setDateOfBirth should handle undefined input', () => {
    const changedSpy = vi.fn();
    comp.changed.subscribe(changedSpy);
    comp.setDateOfBirth(undefined);
    expect(comp.data().dateOfBirth).toBe('');
    expect(changedSpy).toHaveBeenCalled();
  });

  it('should include optional fields in form and allow valid values', () => {
    comp.data.set({
      ...comp.data(),
      firstName: 'Foo',
      lastName: 'Bar',
      email: 'foo@bar.com',
      phoneNumber: '55555',
      street: '123 Street',
      city: 'Townsville',
      postcode: '80331',
      country: { value: 'DE', name: 'Germany' },
      gender: { value: 'male', name: 'Male' },
      nationality: { value: 'FR', name: 'France' },
      dateOfBirth: '1990-01-01',
      website: 'https://example.com',
      linkedIn: 'https://linkedin.com/in/example',
    });

    const form = comp.page1Form();
    form.updateValueAndValidity();
    expect(form.valid).toBe(true);
  });

  it('getPage1FromApplication handles missing fields gracefully', () => {
    const app: ApplicationForApplicantDTO = {
      applicationState: 'SAVED',
      job: {
        jobId: '2345',
        professorName: 'Professor Name',
        location: 'Garching',
        title: 'Example Job',
      },
    };
    const page1 = getPage1FromApplication(app);
    expect(page1.firstName).toBe('');
    expect(page1.gender).toBeUndefined();
  });
});

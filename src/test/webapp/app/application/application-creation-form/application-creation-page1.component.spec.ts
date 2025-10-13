import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage1Component, {
  getPage1FromApplication,
  selectGender,
  selectLanguage,
} from '../../../../../main/webapp/app/application/application-creation/application-creation-page1/application-creation-page1.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AccountService, User } from 'app/core/auth/account.service';

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
        provideFontAwesomeTesting()
      ],
      schemas: [NO_ERRORS_SCHEMA],
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
      language: undefined,
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
      language: undefined,
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
    const fakeApp: any = {
      applicant: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '9999',
          gender: 'male',
          nationality: 'US',
          selectedLanguage: 'en',
          birthday: '1990-01-01',
          website: 'https://site.com',
          linkedinUrl: 'https://li.com',
        },
        street: 'Street 1',
        city: 'CityX',
        country: 'US',
        postalCode: '12345',
      },
    };

    const page1 = getPage1FromApplication(fakeApp);
    expect(page1.firstName).toBe('John');
    expect(page1.gender).toEqual(selectGender.find(g => g.value === 'male'));
    expect(page1.language).toEqual(selectLanguage.find(l => l.value === 'en'));
    expect(page1.country?.value).toBe('US');
  });

  it('should emit changed and valid when form changes', () => {
    const form = comp.page1Form();
    const changedSpy = vi.fn();
    const validSpy = vi.fn();
    comp.changed.subscribe(changedSpy);
    comp.valid.subscribe(validSpy);

    // Now change a field
    form.controls.firstName.setValue('Bob');

    // After change detection / effect, should have emitted
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
});

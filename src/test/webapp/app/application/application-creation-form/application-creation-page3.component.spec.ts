import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage3Component, { getPage3FromApplication } from '../../../../../main/webapp/app/application/application-creation/application-creation-page3/application-creation-page3.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AccountService, User } from 'app/core/auth/account.service';
import { AbstractControl } from '@angular/forms';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { ApplicantDTO } from 'app/generated/model/applicantDTO';

describe('ApplicationPage3Component', () => {
  let fixture: ComponentFixture<ApplicationCreationPage3Component>;
  let comp: ApplicationCreationPage3Component;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage3Component],
      providers: [
        provideRouter([]),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationCreationPage3Component);
    comp = fixture.componentInstance;
    comp.hasInitialized.set(false);
    comp.data.set({
      desiredStartDate: '',
      motivation: '',
      skills: '',
      experiences: '',
    });
    fixture.detectChanges();
  });
  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });

  it('should set cvValid to false when cvDocs is undefined or empty', () => {
    comp.cvDocsSetValidity(undefined);
    expect(comp.cvValid()).toBe(false);

    comp.cvDocsSetValidity([]);
    expect(comp.cvValid()).toBe(false);
  });

  it('should set cvValid to true when cvDocs is provided', () => {
    comp.cvDocsSetValidity([{ id: 1 } as any]);
    expect(comp.cvValid()).toBe(true);
  });

  it('should update desiredStartDate in form and data when setDesiredStartDate is called', () => {
    const newDate = '2025-12-25';
    comp.setDesiredStartDate(newDate);

    expect(comp.data()?.desiredStartDate).toBe(newDate);
    expect(comp.page3Form.value.desiredStartDate).toBe(newDate);
  });

  it('should mark form as invalid when required fields are empty', () => {
    comp.page3Form.patchValue({
      experiences: '',
      motivation: '',
      skills: '',
    });
    expect(comp.page3Form.valid).toBe(false);
  });

  it('should mark form as valid when required fields are filled and CV is set', () => {
    comp.cvDocsSetValidity([{ id: 1 } as any]);
    comp.page3Form.patchValue({
      experiences: '<p>Experience</p>',
      motivation: '<p>Motivation</p>',
      skills: '<p>Skills</p>',
    });

    expect(comp.page3Form.valid).toBe(true);
    expect(comp.cvValid()).toBe(true);
  });

  it('should patch form with initial data on first run', () => {
    comp.data.set({
      experiences: '<p>Initial Exp</p>',
      motivation: '<p>Initial Mot</p>',
      skills: '<p>Initial Skills</p>',
      desiredStartDate: '2025-01-01',
    });
    comp.hasInitialized.set(false);

    fixture.detectChanges();

    expect(comp.page3Form.value.experiences).toBe('<p>Initial Exp</p>');
    expect(comp.page3Form.value.motivation).toBe('<p>Initial Mot</p>');
    expect(comp.page3Form.value.skills).toBe('<p>Initial Skills</p>');
    expect(comp.page3Form.value.desiredStartDate).toBe('2025-01-01');
  });

  it('should render editors when hasInitialized is true', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('jhi-editor[label="entity.applicationPage3.label.motivation"]')).toBeTruthy();
    expect(compiled.querySelector('jhi-editor[label="entity.applicationPage3.label.skills"]')).toBeTruthy();
    expect(compiled.querySelector('jhi-editor[label="entity.applicationPage3.label.experiences"]')).toBeTruthy();
  });

  it('should emit changed when emitChanged is called', () => {
    const changedSpy = vi.fn();
    comp.changed.subscribe(changedSpy);

    comp.emitChanged();
    expect(changedSpy).toHaveBeenCalledWith(true);
  });

  it('should not update data if currentData is undefined in setDesiredStartDate', () => {
    comp.hasInitialized.set(false);
    comp.data.set(undefined); // simulate undefined data
    comp.setDesiredStartDate('2025-12-25');

    // Should not throw or set anything
    expect(comp.page3Form.value.desiredStartDate).toBe('2025-12-25'); // still patches form
  });

  it('should initialize form with fallback empty strings if data is undefined on instantiation', () => {
    const testFixture = TestBed.createComponent(ApplicationCreationPage3Component);
    const testComp = testFixture.componentInstance;

    // Set data to undefined before triggering form creation
    testComp.data.set(undefined);
    testFixture.detectChanges();

    expect(testComp.page3Form.getRawValue()).toEqual({
      experiences: '',
      motivation: '',
      skills: '',
      desiredStartDate: '',
    });
  });

  it('should return array with doc if documentIdsCv is defined', () => {
    const doc = { id: 1 } as any;

    fixture.componentRef.setInput('documentIdsCv', doc);
    fixture.detectChanges();

    expect(comp.computedDocumentIdsCvSet()).toEqual([doc]);
  });

  it('should return undefined if documentIdsCv is undefined', () => {
    fixture.componentRef.setInput('documentIdsCv', undefined);
    fixture.detectChanges();

    expect(comp.computedDocumentIdsCvSet()).toBeUndefined();
  });

  it('should normalize undefined values in form to empty strings in updateEffect', () => {
    comp.page3Form.patchValue({
      experiences: undefined,
      motivation: undefined,
      skills: undefined,
      desiredStartDate: undefined,
    });

    expect(comp.data()).toEqual({
      experiences: '',
      motivation: '',
      skills: '',
      desiredStartDate: '',
    });
  });

  it('should normalize undefined values in form to empty strings in updateEffect', () => {

    comp.data.set(undefined);

    fixture.detectChanges();

    expect(comp.data()).toEqual({
      experiences: '',
      motivation: '',
      skills: '',
      desiredStartDate: '',
    });
  });

  it('should normalize undefined values to empty strings in updateEffect mapping', () => {
    // Reset and simulate data + initialized form
    comp.data.set({
      experiences: 'Old',
      motivation: 'Old',
      skills: 'Old',
      desiredStartDate: 'Old',
    });

    comp.hasInitialized.set(true);

    comp.page3Form.patchValue({
      experiences: undefined,
      motivation: undefined,
      skills: undefined,
      desiredStartDate: undefined,
    });

    // Wait for effect to run (simulate debounce time)
    fixture.detectChanges();

    expect(comp.data()).toEqual({
      experiences: '',
      motivation: '',
      skills: '',
      desiredStartDate: '',
    });
  });

  it('should not patch form if data is undefined in initializeFormEffect', () => {
    const newFixture = TestBed.createComponent(ApplicationCreationPage3Component);
    const newComp = newFixture.componentInstance;

    newComp.data.set(undefined);
    newComp.hasInitialized.set(false);
    newFixture.detectChanges();

    expect(newComp.page3Form.value).toEqual({
      experiences: '',
      motivation: '',
      skills: '',
      desiredStartDate: '',
    });
    expect(newComp.hasInitialized()).toBe(false);
  });

  // getPage3FromApplication
  it('should extract all fields when all values are present', () => {
    const application: ApplicationForApplicantDTO = {
      desiredDate: '2025-12-25',
      motivation: 'Because I love coding',
      specialSkills: 'Angular, TypeScript',
      projects: 'Built multiple apps',
    } as any;

    const result = getPage3FromApplication(application);

    expect(result).toEqual({
      desiredStartDate: '2025-12-25',
      motivation: 'Because I love coding',
      skills: 'Angular, TypeScript',
      experiences: 'Built multiple apps',
    });
  });

  it('should return empty string for missing desiredDate', () => {
    const application = {
      desiredDate: undefined,
      motivation: 'Motivation',
      specialSkills: 'Skills',
      projects: 'Projects',
    } as ApplicationForApplicantDTO;

    const result = getPage3FromApplication(application);

    expect(result.desiredStartDate).toBe('');
    expect(result.motivation).toBe('Motivation');
  });

  it('should return empty string for missing motivation', () => {
    const application = {
      desiredDate: '2025-01-01',
      motivation: undefined,
      specialSkills: 'Skills',
      projects: 'Projects',
    } as ApplicationForApplicantDTO;

    const result = getPage3FromApplication(application);

    expect(result.motivation).toBe('');
  });

  it('should return empty string for missing specialSkills', () => {
    const application = {
      desiredDate: '2025-01-01',
      motivation: 'Motivation',
      specialSkills: undefined,
      projects: 'Projects',
    } as ApplicationForApplicantDTO;

    const result = getPage3FromApplication(application);

    expect(result.skills).toBe('');
  });

  it('should return empty string for missing projects', () => {
    const application = {
      desiredDate: '2025-01-01',
      motivation: 'Motivation',
      specialSkills: 'Skills',
      projects: undefined,
    } as ApplicationForApplicantDTO;

    const result = getPage3FromApplication(application);

    expect(result.experiences).toBe('');
  });

  it('should return empty strings for all undefined fields', () => {
    const application = {} as ApplicationForApplicantDTO;

    const result = getPage3FromApplication(application);

    expect(result).toEqual({
      desiredStartDate: '',
      motivation: '',
      skills: '',
      experiences: '',
    });
  });

  it('should set desiredStartDate to empty string when desiredStartDateEvent is undefined', () => {
    comp.setDesiredStartDate(undefined);
    expect(comp.data()?.desiredStartDate).toBe('');
  });

  // it('should initialize form with empty strings when data is undefined at construction time', () => {
  //   // Create a completely fresh component without beforeEach setup
  //   // This ensures data() is undefined when the form is initialized
  //   const standAloneFixture = TestBed.createComponent(ApplicationCreationPage3Component);
  //   const standAloneComp = standAloneFixture.componentInstance;

  //   // At this point, data is undefined and form should have used '' fallbacks
  //   expect(standAloneComp.page3Form.getRawValue()).toEqual({
  //     experiences: '',
  //     motivation: '',
  //     skills: '',
  //     desiredStartDate: '',
  //   });
  // });

  // // Test for line 96: The v ?? '' normalization in updateEffect with hasInitialized = true
  // it('should normalize undefined form values to empty strings when hasInitialized is true', () => {
  //   // Set hasInitialized to true so updateEffect doesn't return early
  //   comp.hasInitialized.set(true);

  //   // Set initial data
  //   comp.data.set({
  //     experiences: 'Some experience',
  //     motivation: 'Some motivation',
  //     skills: 'Some skills',
  //     desiredStartDate: '2025-01-01',
  //   });

  //   fixture.detectChanges();

  //   // Now patch with undefined values - this should trigger the normalization
  //   comp.page3Form.patchValue({
  //     experiences: undefined,
  //     motivation: undefined,
  //     skills: undefined,
  //     desiredStartDate: undefined,
  //   });

  //   // Trigger change detection to run the effect
  //   fixture.detectChanges();

  //   // Wait a bit for debounceTime(100)
  //   setTimeout(() => {
  //     expect(comp.data()).toEqual({
  //       experiences: '',
  //       motivation: '',
  //       skills: '',
  //       desiredStartDate: '',
  //     });
  //   }, 150);
  // });

  // // If you need this test to be synchronous, use fakeAsync/tick:
  // it('should normalize undefined form values to empty strings when hasInitialized is true', () => {
  //   comp.hasInitialized.set(true);

  //   comp.data.set({
  //     experiences: 'Some experience',
  //     motivation: 'Some motivation',
  //     skills: 'Some skills',
  //     desiredStartDate: '2025-01-01',
  //   });

  //   fixture.detectChanges();

  //   comp.page3Form.patchValue({
  //     experiences: undefined,
  //     motivation: undefined,
  //     skills: undefined,
  //     desiredStartDate: undefined,
  //   });

  //   fixture.detectChanges();
  //   // tick(150); // Wait for debounceTime(100)

  //   expect(comp.data()).toEqual({
  //     experiences: '',
  //     motivation: '',
  //     skills: '',
  //     desiredStartDate: '',
  //   });
  // });
  // it('should handle both defined and undefined values in updateEffect map (line 96)', () => {
  //   comp.hasInitialized.set(true);

  //   // Start with mix of defined and undefined
  //   comp.data.set({
  //     experiences: 'Some experience',
  //     motivation: '',  // empty string is defined
  //     skills: undefined as any,
  //     desiredStartDate: '2025-01-01',
  //   });

  //   fixture.detectChanges();

  //   // Now patch with mix to trigger map with different value types
  //   comp.page3Form.patchValue({
  //     experiences: undefined,      // undefined -> should become ''
  //     motivation: 'New motivation', // defined -> should stay
  //     skills: undefined,           // undefined -> should become ''
  //     desiredStartDate: '2025-12-31', // defined -> should stay
  //   });


  //   const result = comp.data();
  //   expect(result?.experiences).toBe('');
  //   expect(result?.motivation).toBe('New motivation');
  //   expect(result?.skills).toBe('');
  //   expect(result?.desiredStartDate).toBe('2025-12-31');
  // });

  // it('should initialize form with real values via initializeFormEffect', () => {
  //   // Create fresh component
  //   const testFixture = TestBed.createComponent(ApplicationCreationPage3Component);
  //   const testComp = testFixture.componentInstance;

  //   // Set data IMMEDIATELY after construction, before hasInitialized is true
  //   testComp.data.set({
  //     experiences: '<p>My Experience</p>',
  //     motivation: '<p>My Motivation</p>',
  //     skills: '<p>My Skills</p>',
  //     desiredStartDate: '2025-06-01',
  //   });

  //   testFixture.detectChanges();

  //   // Form should have been patched with these values
  //   expect(testComp.page3Form.getRawValue()).toEqual({
  //     experiences: '<p>My Experience</p>',
  //     motivation: '<p>My Motivation</p>',
  //     skills: '<p>My Skills</p>',
  //     desiredStartDate: '2025-06-01',
  //   });
  // });

  // Test the inverse: ensure empty strings are preserved (not converted to undefined)
  // it('should preserve empty strings in form values', () => {
  //   comp.hasInitialized.set(true);

  //   comp.page3Form.patchValue({
  //     experiences: '',
  //     motivation: '',
  //     skills: '',
  //     desiredStartDate: '',
  //   });

  //   expect(comp.data()).toEqual({
  //     experiences: '',
  //     motivation: '',
  //     skills: '',
  //     desiredStartDate: '',
  //   });
  // });

  // // Test specifically for the ?? operator with non-empty values
  // it('should preserve truthy values through form patches', () => {
  //   comp.hasInitialized.set(true);

  //   // Test with various truthy values
  //   comp.page3Form.patchValue({
  //     experiences: '<p>Test</p>',
  //     motivation: 'M',
  //     skills: '0', // edge case: '0' is truthy
  //     desiredStartDate: '2025-01-01',
  //   });
  //   fixture.detectChanges();
  //   const result = comp.data();
  //   expect(result?.experiences).toBe('<p>Test</p>');
  //   expect(result?.motivation).toBe('M');
  //   expect(result?.skills).toBe('0');
  //   expect(result?.desiredStartDate).toBe('2025-01-01');
  // });

  // Ensure both branches of normalization are tested
  // it('should normalize only undefined values, not other falsy values', () => {
  //   comp.hasInitialized.set(true);

  //   comp.data.set({
  //     experiences: 'Old',
  //     motivation: 'Old',
  //     skills: 'Old',
  //     desiredStartDate: 'Old',
  //   });

  //   fixture.detectChanges();

  //   comp.page3Form.patchValue({
  //     experiences: undefined,  // should become ''
  //     motivation: '',          // should stay ''
  //     skills: '0',            // should stay '0'
  //     desiredStartDate: undefined, // should become ''
  //   });

  //   expect(comp.data()).toEqual({
  //     experiences: '',
  //     motivation: '',
  //     skills: '',
  //     desiredStartDate: '',
  //   });
  // });

  // ============ TRY THESE FOR LINE 96 ============
  // Directly set control values to undefined (bypassing Angular's normalization)
  // it('should handle undefined in updateEffect via direct control manipulation', () => {
  //   comp.hasInitialized.set(true);
  //   fixture.detectChanges();

  //   // Directly set control values to test both branches
  //   comp.page3Form.get('experiences')?.setValue(undefined);
  //   comp.page3Form.get('motivation')?.setValue('Has value');
  //   comp.page3Form.get('skills')?.setValue(null); // null is also nullish
  //   comp.page3Form.get('desiredStartDate')?.setValue('2025-01-01');
  //   fixture.detectChanges();
  //   const result = comp.data();
  //   expect(result?.experiences).toBe('');
  //   expect(result?.motivation).toBe('Has value');
  //   expect(result?.skills).toBe('');
  //   expect(result?.desiredStartDate).toBe('2025-01-01');
  // });

  // ============ TRY THESE FOR LINES 72-75 ============
  // The form init uses data()?.field ?? '', we need BOTH branches
  // Create component with data already set (before class field initialization)
  // it('should handle pre-initialized data in form constructor', () => {
  //   // This is tricky - we need data to exist DURING construction
  //   // Try using componentRef.setInput BEFORE detectChanges
  //   const testFixture = TestBed.createComponent(ApplicationCreationPage3Component);

  //   // Set input synchronously before any initialization
  //   testFixture.componentRef.setInput('data', {
  //     experiences: '<p>Pre-init exp</p>',
  //     motivation: '<p>Pre-init mot</p>',
  //     skills: '<p>Pre-init skills</p>',
  //     desiredStartDate: '2025-01-01',
  //   });

  //   // Now trigger initialization
  //   testFixture.detectChanges();

  //   const testComp = testFixture.componentInstance;
  //   const formValue = testComp.page3Form.getRawValue();

  //   // If data was set before construction, form should have these values
  //   console.log('Form value:', formValue);
  //   expect(formValue.experiences).toBeTruthy();
  // });

  // it('Test with null instead of undefined', () => {
  //   comp.hasInitialized.set(false);

  //   comp.page3Form.get('experiences')?.setValue(null);
  //   comp.page3Form.get('motivation')?.setValue('value');
  //   fixture.detectChanges();
  //   expect(comp.data()).toMatchObject({
  //     experiences: '',
  //     motivation: 'value',
  //   });
  // });
});
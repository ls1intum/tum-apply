import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendar, faChevronDown, faChevronUp, faCloudArrowUp, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { ComponentRef } from '@angular/core';
import { MissingTranslationHandler, TranslateModule, TranslateService } from '@ngx-translate/core';
import { missingTranslationHandler } from 'app/config/translation.config';

import ApplicationCreationPage3Component, { ApplicationCreationPage3Data } from './application-creation-page3.component';

const mockData: ApplicationCreationPage3Data = {
  desiredStartDate: '2032-3-2',
  experiences: 'I have experiences',
  motivation: 'I need more experiences',
  skills: 'I can make experiences',
};

describe('ApplicationCreationPage3Component', () => {
  let component: ApplicationCreationPage3Component;
  let fixture: ComponentFixture<ApplicationCreationPage3Component>;
  let componentRef: ComponentRef<ApplicationCreationPage3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplicationCreationPage3Component,
        TranslateModule.forRoot({
          missingTranslationHandler: {
            provide: MissingTranslationHandler,
            useFactory: missingTranslationHandler,
          },
        }),
      ],
    })
      .overrideTemplate(
        ApplicationCreationPage3Component,
        `
        <div>
          <form [formGroup]="page3Form">
            <textarea formControlName="motivation"></textarea>
            <textarea formControlName="experiences"></textarea>
            <textarea formControlName="skills"></textarea>
            <input formControlName="desiredStartDate" />
          </form>
        </div>
      `,
      )
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationPage3Component);
    component = fixture.componentInstance;

    const translateService = TestBed.inject(TranslateService);
    translateService.setDefaultLang('en');

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faChevronDown);
    library.addIcons(faChevronUp);
    library.addIcons(faCalendar);
    library.addIcons(faCloudArrowUp);
    library.addIcons(faInfoCircle);

    componentRef = fixture.componentRef;
    componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with provided data', () => {
    expect(component.page3Form.controls.motivation.value).toBe('I need more experiences');
    expect(component.page3Form.controls.experiences.value).toBe('I have experiences');
    expect(component.page3Form.controls.skills.value).toBe('I can make experiences');
    expect(component.page3Form.controls.desiredStartDate.value).toBe('2032-3-2');
  });

  it('should reflect user input in the bound model', async () => {
    const newValue = 'Driven by innovation';
    component.page3Form.controls['motivation'].setValue(newValue);

    // Wait for the debounced form value changes and effects to process
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 150)); // Wait for debounceTime(100)
    fixture.detectChanges();

    // The data model should be updated (not just the form control)
    expect(component.data()?.motivation).toBe('Driven by innovation');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faCalendar,
  faCaretLeft,
  faCaretRight,
  faChevronDown,
  faChevronUp,
  faEnvelope,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

import ApplicationCreationPage1Component, { ApplicationCreationPage1Data, selectLanguage } from './application-creation-page1.component';

const mockData: ApplicationCreationPage1Data = {
  firstName: 'Anna',
  lastName: 'Schmidt',
  email: 'anna.schmidt@example.com',
  phoneNumber: '+49 170 1234567',
  gender: { value: 'female', name: 'female' },
  nationality: { value: 'german', name: 'German' },
  language: selectLanguage.find(v => v.value === 'de'),
  dateOfBirth: '1990-05-15',
  website: 'https://annaschmidt.dev',
  linkedIn: 'https://www.linkedin.com/in/annaschmidt',
  street: 'Hauptstraße',
  city: 'Berlin',
  country: { name: 'GE', value: 'Germany' },
  postcode: '10115',
};

describe('ApplicationCreationPage1Component', () => {
  let component: ApplicationCreationPage1Component;
  let fixture: ComponentFixture<ApplicationCreationPage1Component>;
  let componentRef: ComponentRef<ApplicationCreationPage1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage1Component, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationPage1Component);
    component = fixture.componentInstance;
    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faEnvelope);
    library.addIcons(faChevronDown);
    library.addIcons(faChevronUp);
    library.addIcons(faCalendar);
    library.addIcons(faCaretLeft);
    library.addIcons(faCaretRight);
    library.addIcons(faArrowRight);
    library.addIcons(faArrowLeft);
    library.addIcons(faInfoCircle);
    componentRef = fixture.componentRef;
    componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

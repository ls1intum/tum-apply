import { ComponentFixture, TestBed } from '@angular/core/testing';

import ApplicationCreationPage3Component, { ApplicationCreationPage3Data } from './application-creation-page3.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendar, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { ComponentRef } from '@angular/core';

let mockData: ApplicationCreationPage3Data = {
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
      imports: [ApplicationCreationPage3Component],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationPage3Component);
    component = fixture.componentInstance;
    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faChevronDown);
    library.addIcons(faChevronUp);
    library.addIcons(faCalendar);
    componentRef = fixture.componentRef;
    componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

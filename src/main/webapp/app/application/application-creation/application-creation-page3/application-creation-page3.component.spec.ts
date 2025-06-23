import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendar, faChevronDown, faChevronUp, faCloudArrowUp, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { ComponentRef } from '@angular/core';

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
      imports: [ApplicationCreationPage3Component],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationPage3Component);
    component = fixture.componentInstance;
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

  it('should reflect user input in the bound model', () => {
    const input = fixture.nativeElement.querySelector('textarea[formControlName="motivation"]');
    input.value = 'Driven by innovation';
    input.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    expect(component.data().motivation).toBe('Driven by innovation');
  });
});

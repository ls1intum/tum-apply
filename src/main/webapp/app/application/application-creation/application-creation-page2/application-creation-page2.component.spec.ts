import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ApplicantDTO } from 'app/generated';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronUp, faCloudArrowUp, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import ApplicationCreationPage2Component, { ApplicationCreationPage2Data } from './application-creation-page2.component';

const mockData: ApplicationCreationPage2Data = {
  bachelorDegreeName: 'B.Sc. Computer Science',
  bachelorDegreeUniversity: 'Technical University of Munich',
  bachelorGradingScale: { value: ApplicantDTO.BachelorGradingScaleEnum.OneToFour, name: 'One To Four' },
  bachelorGrade: '2.0',
  masterDegreeName: 'M.Sc. Artificial Intelligence',
  masterDegreeUniversity: 'University of Heidelberg',
  masterGradingScale: { value: ApplicantDTO.MasterGradingScaleEnum.OneToFour, name: 'One To Four' },
  masterGrade: '1.3',
};

describe('ApplicationCreationPage2Component', () => {
  let component: ApplicationCreationPage2Component;
  let fixture: ComponentFixture<ApplicationCreationPage2Component>;
  let componentRef: ComponentRef<ApplicationCreationPage2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage2Component],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationPage2Component);
    component = fixture.componentInstance;
    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faChevronDown);
    library.addIcons(faChevronUp);
    library.addIcons(faCloudArrowUp);
    library.addIcons(faInfoCircle);
    componentRef = fixture.componentRef;
    componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

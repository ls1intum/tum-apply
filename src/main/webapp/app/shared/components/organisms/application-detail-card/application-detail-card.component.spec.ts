import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faArrowRightArrowLeft,
  faBrain,
  faBuildingColumns,
  faCircleUser,
  faFlask,
  faLink,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
import { ApplicationDetailDTO } from 'app/generated';
import { ComponentRef } from '@angular/core';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { MissingTranslationHandler, TranslateModule, TranslateService } from '@ngx-translate/core';
import { missingTranslationHandler } from 'app/config/translation.config';

import { ApplicationDetailCardComponent } from './application-detail-card.component';

const mockData: ApplicationDetailDTO = {
  applicationId: 'app-123456',
  applicant: {
    user: {
      userId: 'user-789',
      email: 'alice.smith@example.com',
      avatar: 'https://example.com/avatar.jpg',
      name: 'Alice Smith',
      gender: 'female',
      nationality: 'German',
      birthday: '1998-04-12',
      phoneNumber: '+49 151 23456789',
      website: 'https://alicesmith.dev',
      linkedinUrl: 'https://linkedin.com/in/alicesmith',
    },
    bachelorDegreeName: 'Computer Science',
    bachelorGradingScale: 'ONE_TO_FOUR',
    bachelorGrade: '1.3',
    bachelorUniversity: 'Technical University of Berlin',
    masterDegreeName: 'Artificial Intelligence',
    masterGradingScale: 'ONE_TO_FOUR',
    masterGrade: '1.1',
    masterUniversity: 'Technical University of Munich',
  },
  applicationState: 'SENT',
  desiredDate: '2025-10-01',
  jobTitle: 'DNS Testing and Molecular Structure Matrices',
  projects:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  specialSkills:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  motivation:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
};

describe('ApplicationDetailCardComponent', () => {
  let component: ApplicationDetailCardComponent;
  let fixture: ComponentFixture<ApplicationDetailCardComponent>;
  let componentRef: ComponentRef<ApplicationDetailCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailCardComponent],
      providers: [],
    }).compileComponents();

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          missingTranslationHandler: {
            provide: MissingTranslationHandler,
            useFactory: missingTranslationHandler,
          },
        }),
      ],
    });
    const translateService = TestBed.inject(TranslateService);
    translateService.setDefaultLang('en');

    fixture = TestBed.createComponent(ApplicationDetailCardComponent);
    component = fixture.componentInstance;

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faLink);
    library.addIcons(faCircleUser);
    library.addIcons(faLinkedin);
    library.addIcons(faBuildingColumns);
    library.addIcons(faArrowRightArrowLeft);
    library.addIcons(faBrain);
    library.addIcons(faRocket);
    library.addIcons(faFlask);

    componentRef = fixture.componentRef;
    componentRef.setInput('application', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render motivation, skills, and research experience sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('entity.applicationDetail.motivation');
    expect(compiled.textContent).toContain('entity.applicationDetail.skills');
    expect(compiled.textContent).toContain('entity.applicationDetail.researchExperience');

    expect(compiled.textContent).toContain(mockData.motivation);
    expect(compiled.textContent).toContain(mockData.specialSkills);
    expect(compiled.textContent).toContain(mockData.projects);
  });

  it('should display both bachelor and master education information', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('entity.detail_card.bachelor_info');
    expect(compiled.textContent).toContain('Computer Science');
    expect(compiled.textContent).toContain('1.3');
    expect(compiled.textContent).toContain('Technical University of Berlin');

    expect(compiled.textContent).toContain('entity.detail_card.master_info');
    expect(compiled.textContent).toContain('Artificial Intelligence');
    expect(compiled.textContent).toContain('1.1');
    expect(compiled.textContent).toContain('Technical University of Munich');
  });
});

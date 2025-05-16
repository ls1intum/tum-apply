import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import ApplicationCreationFormComponent from './application-creation-form.component';

import { ApplicationResourceService, JobResourceService } from 'app/generated';
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
} from '@fortawesome/free-solid-svg-icons';
import { HttpResponse } from '@angular/common/http';

class MockApplicationResourceService {
  getApplicationById = jest.fn().mockReturnValue(of({}));
  createApplication = jest.fn();
}

class MockJobResourceService {
  getJobDetail = jest.fn().mockReturnValue(of({}));
}

describe('ApplicationCreationFormComponent create', () => {
  let component: ApplicationCreationFormComponent;
  let fixture: ComponentFixture<ApplicationCreationFormComponent>;

  // let componentRef: ComponentRef<ApplicationCreationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            url: of([{ path: 'application' }, { path: 'create' }]),
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'job_id') return '123';
                  if (key === 'application_id') return '456';
                  return null;
                },
              },
            },
          },
        },
        {
          provide: ApplicationResourceService,
          useClass: MockApplicationResourceService,
        },
        {
          provide: JobResourceService,
          useValue: {
            getJobDetails: jest.fn().mockReturnValue(of(new HttpResponse({ body: { title: 'Test title' } }))),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
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

    // componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set mode to "create" and extract jobId from route', () => {
    expect(component.mode).toBe('create');
    expect(component.jobId).toBe('123');
  });
});

// describe('ApplicationCreationFormComponent edit', () => {
//   let component: ApplicationCreationFormComponent;
//   let fixture: ComponentFixture<ApplicationCreationFormComponent>;

//   let componentRef: ComponentRef<ApplicationCreationFormComponent>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [ApplicationCreationFormComponent],
//       providers: [
//         {
//           provide: ActivatedRoute,
//           useValue: {
//             url: of([{path: 'application'}, { path: 'create' }]),
//             snapshot: {
//               paramMap: {
//                 get: (key: string) => {
//                   if (key === 'job_id') return '123';
//                   if (key === 'application_id') return '456';
//                   return null;
//                 },
//               },
//             },
//           },
//         },
//         {
//           provide: ApplicationResourceService,
//           useClass: MockApplicationResourceService,
//         },
//       ]
//     }).compileComponents();

//     fixture = TestBed.createComponent(ApplicationCreationFormComponent);
//     component = fixture.componentInstance;

//     const library = TestBed.inject(FaIconLibrary);
//     library.addIcons(faEnvelope);
//     library.addIcons(faChevronDown);
//     library.addIcons(faChevronUp);
//     library.addIcons(faCalendar);
//     library.addIcons(faCaretLeft);
//     library.addIcons(faCaretRight);
//     library.addIcons(faArrowRight);
//     library.addIcons(faArrowLeft);

//     componentRef = fixture.componentRef;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('should load application and populate form in "edit" mode', () => {
//     const mockApplication = {
//       applicant: {
//         user: {
//           firstName: 'Jane',
//           lastName: 'Doe',
//           email: 'jane@example.com',
//           phoneNumber: '123',
//           gender: 'FEMALE',
//           nationality: 'DE',
//           selectedLanguage: 'EN',
//           birthday: '1990-01-01',
//           website: '',
//           linkedinUrl: '',
//         },
//         bachelorDegreeName: 'BSc Test',
//         bachelorUniversity: 'Test Uni',
//         bachelorGrade: '1.0',
//         masterDegreeName: '',
//         masterUniversity: '',
//         masterGrade: '',
//       },
//       desiredDate: '2025-09-01',
//       motivation: 'Test motivation',
//       specialSkills: 'Testing',
//       projects: 'Project X',
//     };

//     const service = TestBed.inject(ApplicationResourceService) as any;
//     service.getApplicationById.mockReturnValue(of(mockApplication));

//     fixture = TestBed.createComponent(ApplicationCreationFormComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();

//     expect(component.page1.firstName).toBe('Jane');
//     expect(component.page2.bachelorDegreeName).toBe('BSc Test');
//     expect(component.page3.motivation).toBe('Test motivation');
//   });
// });

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
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
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { MissingTranslationHandler, TranslateModule, TranslateService } from '@ngx-translate/core';
import { missingTranslationHandler } from 'app/config/translation.config';
import { MessageService } from 'primeng/api';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ApplicationResourceApiService } from '../../generated/api/applicationResourceApi.service';

import ApplicationDetailForApplicantComponent from './application-detail-for-applicant.component';

class MockApplicationResourceService {
  getApplicationForDetailPage = jest.fn().mockReturnValue(of({ id: '123', jobTitle: 'DNS Testing and Molecular Structure Matrices' }));
  getDocumentDictionaryIds = jest.fn().mockReturnValue({
    bachelorDocumentDictionaryIds: ['doc1', 'doc2'],
    masterDocumentDictionaryIds: [],
    cvDocumentDictionaryId: 'cv1',
    referenceDocumentDictionaryIds: [],
  });
}

async function waitForComponentUpdate(fixture: ComponentFixture<ApplicationDetailForApplicantComponent>): Promise<void> {
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('ApplicationDetailForApplicantComponent', () => {
  let component: ApplicationDetailForApplicantComponent;
  let fixture: ComponentFixture<ApplicationDetailForApplicantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailForApplicantComponent, NoopAnimationsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            url: of([{ path: 'application' }, { path: 'detail' }]),
            snapshot: {
              paramMap: {
                get() {
                  return '123';
                },
              },
            },
          },
        },
        {
          provide: ApplicationResourceApiService,
          useClass: MockApplicationResourceService,
        },
        MessageService,
      ],
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

    fixture = TestBed.createComponent(ApplicationDetailForApplicantComponent);
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

    await waitForComponentUpdate(fixture);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the application detail card when application data is present', async () => {
    await waitForComponentUpdate(fixture);
    const compiled = fixture.nativeElement as HTMLElement;
    const detailCard = compiled.querySelector('jhi-application-detail-card');
    expect(detailCard).toBeTruthy();
  });

  it('should display "Application not found" when no application is available', () => {
    component.actualDetailData.set(null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Application not found');
  });
});

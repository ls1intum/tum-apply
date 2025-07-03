import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpEventType, HttpResponse, provideHttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApplicationResourceService } from 'app/generated';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCheck, faCloudArrowUp, faFileCircleCheck, faPlus, faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';

import { UploadButtonComponent } from './upload-button.component';

class MockApplicationResourceService {
  uploadDocuments(): Observable<
    | HttpResponse<any>
    | {
        type: HttpEventType;
        loaded: number;
        total: number;
      }
  > {
    // Simulate an observable HTTP stream of events
    return of({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 }, {
      type: HttpEventType.Response,
      body: ['mock-doc-id'],
    } as HttpResponse<any>);
  }

  deleteDocumentBatchByTypeFromApplication = (): any => {};
  deleteDocumentFromApplication = (): any => {};
}

describe('UploadButtonComponent', () => {
  let component: UploadButtonComponent;
  let fixture: ComponentFixture<UploadButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadButtonComponent, TranslateModule.forRoot()],
      providers: [
        TranslateStore,
        TranslateLoader,
        TranslateCompiler,
        TranslateParser,
        { provide: ApplicationResourceService, useClass: MockApplicationResourceService },
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        TranslateService,
        provideHttpClient(),
      ],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faCloudArrowUp);
    library.addIcons(faCheck);
    library.addIcons(faPlus);
    library.addIcons(faUpload);
    library.addIcons(faTimes);
    library.addIcons(faFileCircleCheck);

    fixture = TestBed.createComponent(UploadButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('applicationId', 'test-app-id');
    fixture.componentRef.setInput('documentType', 'CV');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

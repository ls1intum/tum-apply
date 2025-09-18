import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
import { MessageService } from 'primeng/api';

import { DocumentInformationHolderDTO } from '../../../../generated/model/documentInformationHolderDTO';
import { ApplicationResourceApiService } from '../../../../generated/api/applicationResourceApi.service';

import { UploadButtonComponent } from './upload-button.component';

class MockApplicationResourceService {
  uploadDocuments(): Observable<DocumentInformationHolderDTO[]> {
    return of([{ id: 'mock-doc-id', name: 'test.pdf', size: 12345 }]);
  }

  deleteDocumentBatchByTypeFromApplication = (): any => of({});
  deleteDocumentFromApplication = (): any => of({});
  renameDocument = (): any => of({});
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
        { provide: ApplicationResourceApiService, useClass: MockApplicationResourceService },
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        TranslateService,
        provideHttpClient(),
        MessageService,
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

  it('should upload files and update documentIds', async () => {
    const mockFiles = [new File(['dummy'], 'test.pdf', { type: 'application/pdf' })];
    component.selectedFiles.set(mockFiles);

    // Call onUpload and subscribe to changes
    await component.onUpload();

    // Wait for observable to complete
    expect(component.documentIds()).toEqual([{ id: 'mock-doc-id', name: 'test.pdf', size: 12345 }]);
    expect(component.selectedFiles()).toEqual([]);
    expect(component.isUploading()).toBe(false);
  });

  it('should rename a document and update it in documentIds', async () => {
    const doc = { id: '123', name: 'Old Name', size: 1024 };
    component.documentIds.set([doc]);

    const service = TestBed.inject(ApplicationResourceApiService);
    const spy = jest.spyOn(service, 'renameDocument').mockReturnValue(of({} as any));

    const updatedDoc = { ...doc, name: 'New Name' };

    await component.renameDocument(updatedDoc);

    expect(spy).toHaveBeenCalledWith('123', 'New Name');
    expect(component.documentIds()).toEqual([{ id: '123', name: 'New Name', size: 1024 }]);
  });

  it('should delete a document and update documentIds list', async () => {
    const doc = { id: 'abc', name: 'doc1', size: 500 };
    component.documentIds.set([doc]);

    const spy = jest.spyOn(TestBed.inject(ApplicationResourceApiService), 'deleteDocumentFromApplication').mockReturnValue(of({} as any));

    await component.deleteDictionary(doc);

    expect(spy).toHaveBeenCalledWith('abc');
    expect(component.documentIds()).toEqual([]);
  });
});

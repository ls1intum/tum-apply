import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ApplicationDocumentIdsDTO, ApplicationResourceService, DocumentResourceService } from 'app/generated';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';
import { of } from 'rxjs';

import DocumentGroupComponent from './document-group.component';

@Component({
  standalone: true,
  template: `<jhi-document-group [documentIds]="mockDocumentIds" />`,
  imports: [DocumentGroupComponent],
})
class TestHostComponent {
  mockDocumentIds: ApplicationDocumentIdsDTO = {};
}
class MockApplicationResourceService {
  getApplicationForDetailPage = jest.fn().mockReturnValue(of({ id: '123', jobTitle: 'DNS Testing and Molecular Structure Matrices' }));
  getDocumentDictionaryIds = jest.fn().mockReturnValue({
    bachelorDocumentDictionaryIds: ['doc1', 'doc2'],
    masterDocumentDictionaryIds: [],
    cvDocumentDictionaryId: 'cv1',
    referenceDocumentDictionaryIds: [],
  });
}

class MockDocumentResourceService {
  downloadDocument = jest.fn().mockReturnValue(of({}));
}

describe('DocumentGroupComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, TranslateModule.forRoot()],
      providers: [
        TranslateStore,
        TranslateLoader,
        TranslateCompiler,
        TranslateParser,
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        TranslateService,
        {
          provide: ApplicationResourceService,
          useClass: MockApplicationResourceService,
        },
        {
          provide: DocumentResourceService,
          useClass: MockDocumentResourceService,
        },
      ],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should render Bachelor Transcript section when bachelor documents exist', () => {
    hostComponent.mockDocumentIds = {
      bachelorDocumentDictionaryIds: [
        { id: 'bachelor-id-1', size: 1234 },
        { id: 'bachelor-id-2', size: 5678 },
      ],
    };
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement;
    const bachelorSection = compiled.querySelector('span[jhitranslate="entity.upload.document_type.BACHELOR_TRANSCRIPT"]');
    expect(bachelorSection).toBeTruthy();

    const viewers = compiled.querySelectorAll('jhi-document-viewer');
    expect(viewers.length).toBe(2);
  });
});

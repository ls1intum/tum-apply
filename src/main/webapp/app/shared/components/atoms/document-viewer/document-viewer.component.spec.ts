import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentResourceService } from 'app/generated';
import { of } from 'rxjs';

import { DocumentViewerComponent } from './document-viewer.component';

class MockDocumentResourceService {
  downloadDocument = jest.fn().mockReturnValue(of({}));
}

describe('DocumentViewerComponent', () => {
  let component: DocumentViewerComponent;
  let fixture: ComponentFixture<DocumentViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentViewerComponent],
      providers: [
        {
          provide: DocumentResourceService,
          useClass: MockDocumentResourceService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    fixture.componentRef.setInput('documentDictionaryId', 'test-id');
    expect(component).toBeTruthy();
  });
});

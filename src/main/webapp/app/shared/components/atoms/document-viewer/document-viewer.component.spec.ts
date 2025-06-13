import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentViewerComponent } from './document-viewer.component';
import { DocumentResourceService } from 'app/generated';
import { of } from 'rxjs';

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
    expect(component).toBeTruthy();
  });
});

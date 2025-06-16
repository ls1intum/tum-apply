import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApplicationResourceService } from 'app/generated';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCheck, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';

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
}

describe('UploadButtonComponent', () => {
  let component: UploadButtonComponent;
  let fixture: ComponentFixture<UploadButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadButtonComponent],
      providers: [{ provide: ApplicationResourceService, useClass: MockApplicationResourceService }],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faCloudArrowUp);
    library.addIcons(faCheck);

    fixture = TestBed.createComponent(UploadButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('applicationId', 'test-app-id');
    fixture.componentRef.setInput('documentType', 'CV');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger upload when a file is selected', () => {
    const fakeFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    jest.spyOn(component, 'uploadFile');
    const event = { target: { files: [fakeFile] } } as unknown as Event;

    component.onFileSelected(event);

    expect(component.selectedFile()).toEqual([fakeFile]);
    expect(component.uploadFile).toHaveBeenCalled();
  });

  it('should disable the button when documentIds is set', () => {
    component.documentIds.set(['doc1', 'doc2']);
    fixture.detectChanges();

    expect(component.disabled()).toBeTruthy();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTruthy();
  });

  it('should alert if total file size exceeds 1MB and not proceed with upload', () => {
    const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'large.pdf'); // 2MB
    component.selectedFile.set([largeFile]);

    jest.spyOn(window, 'alert');
    const spy = jest.spyOn(component['applicationService'], 'uploadDocuments');

    component.uploadFile();

    expect(window.alert).toHaveBeenCalledWith('The total size of the file(s) being uploaded is too large. Upload aborted.');
    expect(spy).not.toHaveBeenCalled();
  });
});

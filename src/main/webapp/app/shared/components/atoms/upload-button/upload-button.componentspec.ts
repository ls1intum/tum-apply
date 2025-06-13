import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ApplicationResourceService } from 'app/generated';

import { UploadButtonComponent } from './upload-button.component';

class MockApplicationResourceService {
  uploadDocuments(appId: string, docType: string, files: File[], observe: string, reportProgress: boolean) {
    // Simulate an observable HTTP stream of events
    return of({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 }, {
      type: HttpEventType.Response,
      body: ['mock-doc-id'],
    } as HttpResponse<any>);
  }
}

describe('StringInputComponent', () => {
  let component: UploadButtonComponent;
  let fixture: ComponentFixture<UploadButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadButtonComponent],
      providers: [{ provide: ApplicationResourceService, useClass: MockApplicationResourceService }],
    }).compileComponents();

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
    const component = fixture.componentInstance;
    const fakeFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    spyOn(component, 'uploadFile');
    const event = { target: { files: [fakeFile] } } as unknown as Event;

    component.onFileSelected(event);

    expect(component.selectedFile()).toEqual([fakeFile]);
    expect(component.uploadFile).toHaveBeenCalled();
  });

  it('should disable the button when documentIds is set', () => {
    const component = fixture.componentInstance;

    component.documentIds.set(['doc1', 'doc2']);
    fixture.detectChanges();

    expect(component.disabled()).toBeTruthy();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTruthy();
  });

  it('should alert if total file size exceeds 1MB and not proceed with upload', () => {
    const component = fixture.componentInstance;

    const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'large.pdf'); // 2MB
    component.selectedFile.set([largeFile]);

    spyOn(window, 'alert');
    const spy = spyOn(component['applicationService'], 'uploadDocuments');

    component.uploadFile();

    expect(window.alert).toHaveBeenCalledWith('The total size of the file(s) being uploaded is too large. Upload aborted.');
    expect(spy).not.toHaveBeenCalled();
  });
});

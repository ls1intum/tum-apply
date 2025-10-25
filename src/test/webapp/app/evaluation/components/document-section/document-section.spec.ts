import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpHeaders, HttpResponse } from '@angular/common/http';

import { ApplicationEvaluationResourceApiService } from 'app/generated/api/applicationEvaluationResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/applicationDocumentIdsDTO';
import { DocumentSection } from 'app/evaluation/components/document-section/document-section';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';

describe('DocumentSection', () => {
  let fixture: ComponentFixture<DocumentSection>;
  let component: DocumentSection;

  let mockApi: { downloadAll: ReturnType<typeof vi.fn> };
  let mockToast: { showError: ReturnType<typeof vi.fn> };
  let mockTranslate: {
    currentLang: string;
    onLangChange: any;
    instant: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockApi = {
      downloadAll: vi.fn(),
    };
    mockToast = {
      showError: vi.fn(),
    };
    mockTranslate = {
      currentLang: 'en',
      onLangChange: of({ lang: 'en' }),
      instant: vi.fn((v: string) => `t:${v}`),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentSection],
      providers: [
        { provide: ApplicationEvaluationResourceApiService, useValue: mockApi },
        { provide: ToastService, useValue: mockToast },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    })
      .overrideComponent(DocumentSection, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(DocumentSection);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('idChangeEffect', () => {
    it('should reset signals when idsDTO undefined', () => {
      fixture.componentRef.setInput('idsDTO', undefined);
      fixture.detectChanges();

      expect(component.documents()).toEqual([]);
      expect(component.extraDocuments()).toEqual([]);
      expect(component.documentsCount()).toBe(0);
    });

    it('should populate documents and extraDocuments correctly', () => {
      const dto: ApplicationDocumentIdsDTO = {
        masterDocumentDictionaryIds: [{ id: 'm1' } as DocumentInformationHolderDTO, { id: 'm2' } as DocumentInformationHolderDTO],
        cvDocumentDictionaryId: { id: 'cv' } as DocumentInformationHolderDTO,
        bachelorDocumentDictionaryIds: [{ id: 'b1' } as DocumentInformationHolderDTO],
        referenceDocumentDictionaryIds: [{ id: 'r1' } as DocumentInformationHolderDTO, { id: 'r2' } as DocumentInformationHolderDTO],
      };
      fixture.componentRef.setInput('idsDTO', dto);
      fixture.detectChanges();

      expect(component.documentsCount()).toBe(6);

      expect(component.documents().length).toBe(3);
      expect(component.extraDocuments().length).toBe(3);
    });

    it('should compute hasDocuments correctly', () => {
      expect(component.hasDocuments()).toBe(false);
      component.documents.set([{ label: 'lbl', document: { id: 'd1' } as DocumentInformationHolderDTO }]);
      expect(component.hasDocuments()).toBe(true);
    });

    it('should compute allDocumentsTooltip using translate.instant', () => {
      component.extraDocuments.set([
        { label: 'lbl1', document: { id: '1' } as DocumentInformationHolderDTO },
        { label: 'lbl2', document: { id: '2' } as DocumentInformationHolderDTO },
      ]);
      const tooltip = component.allDocumentsTooltip();
      expect(tooltip).toBe('t:lbl1, t:lbl2');
      expect(mockTranslate.instant).toHaveBeenCalledWith('lbl1');
    });
  });

  describe('downloadAllDocuments', () => {
    let createObjectSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectSpy: ReturnType<typeof vi.spyOn>;
    let clickSpy: ReturnType<typeof vi.spyOn>;
    let anchor: HTMLAnchorElement;

    beforeEach(() => {
      anchor = document.createElement('a');
      clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
      createObjectSpy = vi.fn().mockReturnValue('blob:url');
      revokeObjectSpy = vi.fn();

      Object.defineProperty(window.URL, 'createObjectURL', {
        writable: true,
        value: createObjectSpy,
      });
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        writable: true,
        value: revokeObjectSpy,
      });

      vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    });

    it('should show error toast if applicationId undefined', async () => {
      fixture.componentRef.setInput('applicationId', undefined);
      await component.downloadAllDocuments();
      expect(mockToast.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'No application selected',
      });
    });

    it('should download file with default filename when no Content-Disposition', async () => {
      const blob = new Blob(['123'], { type: 'application/zip' });
      const headers = new HttpHeaders();
      const response = new HttpResponse({ body: blob, headers });
      mockApi.downloadAll.mockReturnValueOnce(of(response));

      fixture.componentRef.setInput('applicationId', 'app-1');
      await component.downloadAllDocuments();

      expect(mockApi.downloadAll).toHaveBeenCalledWith(
        'app-1',
        'response',
        false,
        expect.objectContaining({ httpHeaderAccept: 'application/zip' }),
      );
      expect(createObjectSpy).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(anchor.download).toBe('documents.zip');
      expect(revokeObjectSpy).toHaveBeenCalledWith('blob:url');
    });

    it('should extract filename from Content-Disposition header', async () => {
      const blob = new Blob();
      const headers = new HttpHeaders({ 'Content-Disposition': 'attachment; filename="test.zip"' });
      const response = new HttpResponse({ body: blob, headers });
      mockApi.downloadAll.mockReturnValueOnce(of(response));

      fixture.componentRef.setInput('applicationId', 'app-2');
      await component.downloadAllDocuments();

      expect(anchor.download).toBe('test.zip');
    });

    it('should show error toast on API failure', async () => {
      mockApi.downloadAll.mockReturnValueOnce(throwError(() => new Error('fail')));

      fixture.componentRef.setInput('applicationId', 'app-3');
      await component.downloadAllDocuments();

      expect(mockToast.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'Failed to download documents',
      });
    });
  });
});

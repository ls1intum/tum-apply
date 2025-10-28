import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { DocumentHolder } from 'app/evaluation/components/document-section/document-section';
import { DocumentDialog } from 'app/evaluation/components/document-dialog/document-dialog';
import { provideTranslateMock } from '../../../../util/translate.mock';
import { DocumentResourceApiService } from 'app/generated/api/documentResourceApi.service';

function createDocument(id: string, name: string, size = 123): DocumentInformationHolderDTO {
  return { id, name, size };
}

function createHolder(id: string, name: string, size = 123): DocumentHolder {
  return { label: `Label ${id}`, document: createDocument(id, name, size) };
}

describe('DocumentDialog (Vitest)', () => {
  let fixture: ComponentFixture<DocumentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentDialog],
      providers: [
        provideTranslateMock(),
        {
          provide: DocumentResourceApiService,
          useValue: {
            downloadDocument: () => of(new ArrayBuffer(0)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDialog);
  });

  describe('initialization', () => {
    it('should not select anything if documentHolders is empty', () => {
      fixture.componentRef.setInput('documentHolders', []);
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedId()).toBeUndefined();
    });

    it('should select the first document if holders exist and no selection set', () => {
      const holders = [createHolder('doc1', 'Doc 1'), createHolder('doc2', 'Doc 2')];
      fixture.componentRef.setInput('documentHolders', holders);
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedId()).toBe('doc1');
    });

    it('should not override selectedId if already set', () => {
      const holders = [createHolder('doc1', 'Doc 1')];
      fixture.componentInstance.selectedId.set('customId');
      fixture.componentRef.setInput('documentHolders', holders);
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedId()).toBe('customId');
    });
  });

  describe('selectedDocument', () => {
    it('should auto-select the first document if selectedId is undefined', () => {
      fixture.componentRef.setInput('documentHolders', [createHolder('doc1', 'Doc 1')]);
      fixture.componentInstance.selectedId.set(undefined);
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedDocument()?.id).toBe('doc1');
    });

    it('should return document if selectedId matches', () => {
      const holders = [createHolder('doc1', 'Doc 1'), createHolder('doc2', 'Doc 2')];
      fixture.componentRef.setInput('documentHolders', holders);
      fixture.componentInstance.selectedId.set('doc2');
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedDocument()?.id).toBe('doc2');
    });

    it('should return undefined if selectedId not found', () => {
      fixture.componentRef.setInput('documentHolders', [createHolder('doc1', 'Doc 1')]);
      fixture.componentInstance.selectedId.set('missing');
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedDocument()).toBeUndefined();
    });
  });

  describe('isSelected', () => {
    it('should return true when id matches selectedDocument', () => {
      fixture.componentRef.setInput('documentHolders', [createHolder('doc1', 'Doc 1')]);
      fixture.componentInstance.selectedId.set('doc1');
      fixture.detectChanges();
      expect(fixture.componentInstance.isSelected('doc1')()).toBe(true);
    });

    it('should return false when id does not match', () => {
      fixture.componentRef.setInput('documentHolders', [createHolder('doc1', 'Doc 1')]);
      fixture.componentInstance.selectedId.set('doc1');
      fixture.detectChanges();
      expect(fixture.componentInstance.isSelected('doc2')()).toBe(false);
    });

    it('should return false if no document selected', () => {
      fixture.componentRef.setInput('documentHolders', []);
      fixture.componentInstance.selectedId.set(undefined);
      fixture.detectChanges();
      expect(fixture.componentInstance.isSelected('doc1')()).toBe(false);
    });
  });

  describe('isChecked & toggleChecked', () => {
    it('should return false if id not checked', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.isChecked('doc1')()).toBe(false);
    });

    it('should return true if id is checked', () => {
      fixture.componentInstance.checkedIds.set(new Set(['doc1']));
      fixture.detectChanges();
      expect(fixture.componentInstance.isChecked('doc1')()).toBe(true);
    });

    it('should add id when toggled with checked=true', () => {
      fixture.componentInstance.toggleChecked('doc1', true);
      fixture.detectChanges();
      expect(fixture.componentInstance.checkedIds().has('doc1')).toBe(true);
    });

    it('should remove id when toggled with checked=false', () => {
      fixture.componentInstance.checkedIds.set(new Set(['doc1']));
      fixture.detectChanges();
      fixture.componentInstance.toggleChecked('doc1', false);
      fixture.detectChanges();
      expect(fixture.componentInstance.checkedIds().has('doc1')).toBe(false);
    });

    it('should not remove other ids when one is toggled off', () => {
      fixture.componentInstance.checkedIds.set(new Set(['doc1', 'doc2']));
      fixture.detectChanges();
      fixture.componentInstance.toggleChecked('doc1', false);
      fixture.detectChanges();
      expect(fixture.componentInstance.checkedIds().has('doc2')).toBe(true);
      expect(fixture.componentInstance.checkedIds().has('doc1')).toBe(false);
    });
  });

  describe('selectDoc', () => {
    it('should update selectedId', () => {
      fixture.componentInstance.selectDoc('doc1');
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedId()).toBe('doc1');
    });
  });
});

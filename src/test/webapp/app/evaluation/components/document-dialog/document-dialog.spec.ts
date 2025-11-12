import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { DocumentHolder } from 'app/shared/components/organisms/document-section/document-section';
import { DocumentDialog } from 'app/shared/components/molecules/document-dialog/document-dialog';
import { provideTranslateMock } from '../../../../util/translate.mock';
import { DocumentResourceApiService } from 'app/generated/api/documentResourceApi.service';

function createDocument(id: string, name: string, size = 123): DocumentInformationHolderDTO {
  return { id, name, size };
}

function createHolder(id: string, name: string, size = 123): DocumentHolder {
  return { label: `Label ${id}`, document: createDocument(id, name, size) };
}

describe('DocumentDialog', () => {
  let fixture: ComponentFixture<DocumentDialog>;
  let component: DocumentDialog;

  function setHolders(holders: DocumentHolder[], selectedId?: string) {
    fixture.componentRef.setInput('documentHolders', holders);
    if (selectedId !== undefined) {
      component.selectedId.set(selectedId);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentDialog],
      providers: [
        provideTranslateMock(),
        {
          provide: DocumentResourceApiService,
          useValue: { downloadDocument: () => of(new ArrayBuffer(0)) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDialog);
    component = fixture.componentInstance;
  });

  describe.each([
    { desc: 'should not select anything if documentHolders is empty', holders: [], selected: undefined, expected: undefined },
    {
      desc: 'should select the first document if holders exist and no selection set',
      holders: [createHolder('doc1', 'Doc 1'), createHolder('doc2', 'Doc 2')],
      selected: undefined,
      expected: 'doc1',
    },
    {
      desc: 'should not override selectedId if already set',
      holders: [createHolder('doc1', 'Doc 1')],
      selected: 'customId',
      expected: 'customId',
    },
  ])('initialization', ({ desc, holders, selected, expected }) => {
    it(desc, () => {
      setHolders(holders, selected);
      expect(component.selectedId()).toBe(expected);
    });
  });

  describe.each([
    {
      desc: 'auto-selects the first document if selectedId is undefined',
      holders: [createHolder('doc1', 'Doc 1')],
      selected: undefined,
      expected: 'doc1',
    },
    {
      desc: 'returns document if selectedId matches',
      holders: [createHolder('doc1', 'Doc 1'), createHolder('doc2', 'Doc 2')],
      selected: 'doc2',
      expected: 'doc2',
    },
    {
      desc: 'returns undefined if selectedId not found',
      holders: [createHolder('doc1', 'Doc 1')],
      selected: 'missing',
      expected: undefined,
    },
  ])('selectedDocument', ({ desc, holders, selected, expected }) => {
    it(desc, () => {
      setHolders(holders, selected);
      expect(component.selectedDocument()?.id).toBe(expected);
    });
  });

  describe.each([
    {
      desc: 'returns true when id matches selectedDocument',
      holders: [createHolder('doc1', 'Doc 1')],
      selected: 'doc1',
      checkId: 'doc1',
      expected: true,
    },
    {
      desc: 'returns false when id does not match',
      holders: [createHolder('doc1', 'Doc 1')],
      selected: 'doc1',
      checkId: 'doc2',
      expected: false,
    },
    { desc: 'returns false if no document selected', holders: [], selected: undefined, checkId: 'doc1', expected: false },
  ])('isSelected', ({ desc, holders, selected, checkId, expected }) => {
    it(desc, () => {
      setHolders(holders, selected);
      expect(component.isSelected(checkId)()).toBe(expected);
    });
  });

  describe('isChecked & toggleChecked', () => {
    it('should return false if id not checked', () => {
      fixture.detectChanges();
      expect(component.isChecked('doc1')()).toBe(false);
    });

    it('should return true if id is checked', () => {
      component.checkedIds.set(new Set(['doc1']));
      fixture.detectChanges();
      expect(component.isChecked('doc1')()).toBe(true);
    });

    it('should add id when toggled with checked=true', () => {
      component.toggleChecked('doc1', true);
      expect(component.checkedIds().has('doc1')).toBe(true);
    });

    it('should remove id when toggled with checked=false', () => {
      component.checkedIds.set(new Set(['doc1']));
      component.toggleChecked('doc1', false);
      expect(component.checkedIds().has('doc1')).toBe(false);
    });

    it('should not remove other ids when one is toggled off', () => {
      component.checkedIds.set(new Set(['doc1', 'doc2']));
      component.toggleChecked('doc1', false);
      expect(component.checkedIds().has('doc2')).toBe(true);
      expect(component.checkedIds().has('doc1')).toBe(false);
    });
  });

  describe('selectDoc', () => {
    it('should update selectedId', () => {
      component.selectDoc('doc1');
      expect(component.selectedId()).toBe('doc1');
    });
  });
});

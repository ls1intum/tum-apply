import { CommonModule } from '@angular/common';
import { Component, Signal, ViewEncapsulation, computed, effect, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslateModule } from '@ngx-translate/core';

import { DocumentInformationHolderDTO } from '../../../generated/model/documentInformationHolderDTO';
import { DocumentViewerComponent } from '../../../shared/components/atoms/document-viewer/document-viewer.component';
import { DocumentHolder } from '../document-section/document-section';
import TranslateDirective from '../../../shared/language/translate.directive';

@Component({
  selector: 'jhi-document-dialog',
  imports: [CommonModule, DialogModule, CheckboxModule, FormsModule, DocumentViewerComponent, TranslateModule, TranslateDirective],
  templateUrl: './document-dialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class DocumentDialog {
  documents = input<DocumentHolder[]>([]);
  isOpen = model<boolean>(false);

  readonly selectedId = signal<string | undefined>(undefined);
  readonly checkedIds = signal<Set<string>>(new Set());

  _initSelection = effect(() => {
    const list = this.documents();
    if (list.length && this.selectedId() === undefined) {
      this.selectedId.set(list[0].document.id);
    }
  });

  selectedDocument = computed<DocumentInformationHolderDTO | undefined>(() => {
    const id = this.selectedId();
    if (id === undefined) {
      return undefined;
    }
    return this.documents().find(d => d.document.id === id)?.document ?? undefined;
  });

  isSelected: (documentId: string) => Signal<boolean> = (documentId: string) => computed(() => this.selectedDocument()?.id === documentId);

  isChecked: (id: string) => Signal<boolean> = (id: string) => computed(() => this.checkedIds().has(id));

  toggleChecked(id: string, checked: boolean): void {
    const next = new Set(this.checkedIds());
    if (checked) next.add(id);
    else next.delete(id);
    this.checkedIds.set(next);
  }

  selectDoc(id: string): void {
    this.selectedId.set(id);
  }
}

import { Component, Signal, ViewEncapsulation, computed, effect, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { DocumentViewerComponent } from 'app/shared/components/atoms/document-viewer/document-viewer.component';
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';

import { DocumentHolder } from '../../organisms/document-section/document-section';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-document-dialog',
  imports: [DialogComponent, CheckboxModule, FormsModule, DocumentViewerComponent, TranslateModule, TranslateDirective],
  templateUrl: './document-dialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class DocumentDialog {
  documentHolders = input<DocumentHolder[]>([]);
  isOpen = model<boolean>(false);

  readonly selectedId = signal<string | undefined>(undefined);
  readonly checkedIds = signal<Set<string>>(new Set());

  _initSelection = effect(() => {
    const list = this.documentHolders();
    if (list.length && this.selectedId() === undefined) {
      this.selectedId.set(list[0].document.id);
    }
  });

  selectedDocument = computed<DocumentInformationHolderDTO | undefined>(() => {
    const id = this.selectedId();
    if (id === undefined) {
      return undefined;
    }
    return this.documentHolders().find(d => d.document.id === id)?.document ?? undefined;
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

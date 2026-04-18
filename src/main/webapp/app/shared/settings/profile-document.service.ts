import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import {
  DocumentInformationHolderDTO,
  DocumentInformationHolderDTODocumentTypeEnum,
} from 'app/generated/model/document-information-holder-dto';

@Injectable({ providedIn: 'root' })
export class ProfileDocumentService {
  private readonly http = inject(HttpClient);
  private readonly applicantApi = inject(ApplicantResourceApi);

  // Sorts by stable server id so document comparisons stay insensitive to UI ordering.
  normalizedDocuments(docs: DocumentInformationHolderDTO[] | undefined): DocumentInformationHolderDTO[] {
    return Array.from(docs ?? [])
      .map(doc => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async commitDocumentTypeChanges(
    initialDocs: DocumentInformationHolderDTO[] | undefined,
    currentDocs: DocumentInformationHolderDTO[] | undefined,
  ): Promise<void> {
    // Only persisted documents participate in the diff; temporary placeholders are uploaded separately afterwards.
    const initial = this.normalizedDocuments(initialDocs);
    const currentPersistedDocs = this.normalizedDocuments(currentDocs).filter(doc => !this.isTemporaryDocument(doc));
    const currentById = new Map(currentPersistedDocs.map(doc => [doc.id, doc]));

    const deletedIds = initial.filter(doc => !currentById.has(doc.id)).map(doc => doc.id);
    const renamedDocs = currentPersistedDocs.flatMap(doc => {
      const initialDoc = initial.find(existing => existing.id === doc.id);
      const newName = doc.name?.trim();
      return initialDoc !== undefined && newName != null && newName !== '' && initialDoc.name !== doc.name
        ? [
            {
              id: doc.id,
              newName,
            },
          ]
        : [];
    });

    for (const documentId of deletedIds) {
      await firstValueFrom(this.applicantApi.deleteApplicantProfileDocument(documentId));
    }

    for (const document of renamedDocs) {
      await firstValueFrom(this.applicantApi.renameApplicantProfileDocument(document.id, document.newName));
    }
  }

  async uploadQueuedByType(
    documentType: DocumentInformationHolderDTODocumentTypeEnum,
    files: File[],
    targetSignal: {
      set: (_value: DocumentInformationHolderDTO[] | undefined) => void;
    },
  ): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const uploadResults = await Promise.all(files.map(file => firstValueFrom(this.uploadApplicantProfileDocument(documentType, file))));

    const latestResult: DocumentInformationHolderDTO[] | undefined = uploadResults[uploadResults.length - 1];
    targetSignal.set(latestResult);
  }

  private isTemporaryDocument(document: DocumentInformationHolderDTO): boolean {
    return document.id.startsWith('temp-');
  }

  private uploadApplicantProfileDocument(
    documentType: DocumentInformationHolderDTODocumentTypeEnum,
    file: File,
  ): Observable<DocumentInformationHolderDTO[]> {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<DocumentInformationHolderDTO[]>(`/api/applicants/profile/documents/${documentType}`, formData);
  }
}

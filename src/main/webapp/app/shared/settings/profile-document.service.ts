import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import {
  DocumentInformationHolderDTO,
  DocumentInformationHolderDTODocumentTypeEnum,
} from 'app/generated/model/document-information-holder-dto';

@Injectable({ providedIn: 'root' })
export class ProfileDocumentService {
  constructor(
    private http: HttpClient,
    private applicantApi: ApplicantResourceApi,
  ) {}

  normalizedDocuments(docs: DocumentInformationHolderDTO[] | undefined): DocumentInformationHolderDTO[] {
    return Array.from(docs ?? [])
      .map(doc => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  isTemporaryDocument(document: DocumentInformationHolderDTO): boolean {
    return document.id.startsWith('temp-');
  }

  async commitDocumentTypeChanges(
    initialDocs: DocumentInformationHolderDTO[] | undefined,
    currentDocs: DocumentInformationHolderDTO[] | undefined,
  ): Promise<void> {
    const initial = this.normalizedDocuments(initialDocs);
    const currentPersistedDocs = this.normalizedDocuments(currentDocs).filter(doc => !this.isTemporaryDocument(doc));
    const currentById = new Map(currentPersistedDocs.map(doc => [doc.id, doc]));

    const deletedIds = initial.filter(doc => !currentById.has(doc.id)).map(doc => doc.id);
    const renamedDocs = currentPersistedDocs.flatMap(doc => {
      const initialDoc = initial.find(existing => existing.id === doc.id);
      const newName = doc.name?.trim();
      return initialDoc !== undefined && newName != null && newName !== '' && initialDoc.name !== doc.name ? [{ id: doc.id, newName }] : [];
    });

    for (const documentId of deletedIds) {
      await firstValueFrom(this.applicantApi.deleteApplicantProfileDocument(documentId));
    }

    for (const document of renamedDocs) {
      await firstValueFrom(this.applicantApi.renameApplicantProfileDocument(document.id, document.newName));
    }
  }

  uploadApplicantProfileDocument(documentType: DocumentInformationHolderDTODocumentTypeEnum, file: File) {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<DocumentInformationHolderDTO[]>(`/api/applicants/profile/documents/${documentType}`, formData);
  }

  async uploadQueuedByType(
    documentType: DocumentInformationHolderDTODocumentTypeEnum,
    files: File[],
  ): Promise<DocumentInformationHolderDTO[] | undefined> {
    if (files.length === 0) return undefined;

    const uploadResults = await Promise.all(files.map(file => firstValueFrom(this.uploadApplicantProfileDocument(documentType, file))));
    return uploadResults[uploadResults.length - 1];
  }
}

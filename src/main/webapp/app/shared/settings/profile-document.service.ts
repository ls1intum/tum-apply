import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import {
  DocumentInformationHolderDTO,
  DocumentInformationHolderDTODocumentTypeEnum,
} from 'app/generated/model/document-information-holder-dto';

/**
 * Service responsible for managing applicant profile documents,
 * including normalization, diffing, uploading, renaming, and deleting.
 */
@Injectable({ providedIn: 'root' })
export class ProfileDocumentService {
  private readonly http = inject(HttpClient);
  private readonly applicantApi = inject(ApplicantResourceApi);

  /**
   * Produces a normalized copy of the given documents, sorted by server id
   * so that comparisons are insensitive to UI ordering.
   *
   * @param docs - the document list to normalize (may be undefined)
   * @return a new array of documents containing only id, name, and size, sorted by id
   */
  normalizedDocuments(docs: DocumentInformationHolderDTO[] | undefined): DocumentInformationHolderDTO[] {
    return Array.from(docs ?? [])
      .map(doc => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Diffs the initial and current document lists and persists all changes
   * (deletions and renames) to the server.
   *
   * @param initialDocs - the document list at the time of the last save
   * @param currentDocs - the document list reflecting the user's current edits
   */
  async commitDocumentTypeChanges(
    initialDocs: DocumentInformationHolderDTO[] | undefined,
    currentDocs: DocumentInformationHolderDTO[] | undefined,
  ): Promise<void> {
    // 1) Normalize both lists and filter out temporary documents from the current set
    const initial = this.normalizedDocuments(initialDocs);
    const currentPersistedDocs = this.normalizedDocuments(currentDocs).filter(doc => !this.isTemporaryDocument(doc));
    const currentById = new Map(currentPersistedDocs.map(doc => [doc.id, doc]));

    // 2) Determine which documents were deleted (present initially, absent now)
    //    and which were renamed (same id, different name)
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

    // 3) Send delete requests for each removed document
    for (const documentId of deletedIds) {
      await firstValueFrom(this.applicantApi.deleteApplicantProfileDocument(documentId));
    }

    // 4) Send rename requests for each renamed document
    for (const document of renamedDocs) {
      await firstValueFrom(this.applicantApi.renameApplicantProfileDocument(document.id, document.newName));
    }
  }

  /**
   * Uploads all queued files of a given document type and updates the target signal
   * with the server's response from the last upload.
   *
   * @param documentType - the type to tag each uploaded file with
   * @param files - the files to upload; if empty, the method returns immediately
   * @param targetSignal - a writable signal whose value is set to the server response
   *                       of the final upload, reflecting the full document list for that type
   */
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

  /**
   * Checks whether a document is a temporary client-side placeholder
   * that has not yet been persisted to the server.
   *
   * @param document - the document to check
   * @return true if the document id starts with 'temp-'
   */
  private isTemporaryDocument(document: DocumentInformationHolderDTO): boolean {
    return document.id.startsWith('temp-');
  }

  /**
   * Uploads a single file as an applicant profile document of the given type.
   *
   * @param documentType - the server-recognized document type
   * @param file - the file to upload
   * @return an observable emitting the updated document list for that type
   */
  private uploadApplicantProfileDocument(
    documentType: DocumentInformationHolderDTODocumentTypeEnum,
    file: File,
  ): Observable<DocumentInformationHolderDTO[]> {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<DocumentInformationHolderDTO[]>(`/api/applicants/profile/documents/${documentType}`, formData);
  }
}

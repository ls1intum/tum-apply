const TEMP_DOCUMENT_ID_PREFIX = 'temp-';

export function isTemporaryDocumentId(id: string | undefined): boolean {
  return id?.startsWith(TEMP_DOCUMENT_ID_PREFIX) ?? false;
}

export function createTemporaryDocumentId(): string {
  return `${TEMP_DOCUMENT_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Prefix used for client-side placeholder document ids. */
const TEMP_DOCUMENT_ID_PREFIX = 'temp-';

/** Returns whether the id belongs to a temporary client-side document placeholder. */
export function isTemporaryDocumentId(id: string | undefined): boolean {
  return id?.startsWith(TEMP_DOCUMENT_ID_PREFIX) ?? false;
}

/** Creates a temporary client-side document id for deferred uploads. */
export function createTemporaryDocumentId(): string {
  return `${TEMP_DOCUMENT_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

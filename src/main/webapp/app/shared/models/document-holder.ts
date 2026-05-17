import type { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';

/** UI model for document list and preview entries. */
export interface DocumentHolder {
  label: string;
  /** Translation parameters for the label. */
  labelParams?: Record<string, unknown>;
  document: DocumentInformationHolderDTO;
  /** Local file for deferred uploads or preview before persistence. */
  file?: File;
  /** Whether the label should be translated. */
  shouldTranslateLabel?: boolean;
}

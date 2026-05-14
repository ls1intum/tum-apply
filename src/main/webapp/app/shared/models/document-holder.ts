import type { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';

export interface DocumentHolder {
  label: string;
  labelParams?: Record<string, unknown>;
  document: DocumentInformationHolderDTO;
  file?: File;
  shouldTranslateLabel?: boolean;
}

import type { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';

export interface DocumentHolder {
  label: string;
  document: DocumentInformationHolderDTO;
  file?: File;
  shouldTranslateLabel?: boolean;
}

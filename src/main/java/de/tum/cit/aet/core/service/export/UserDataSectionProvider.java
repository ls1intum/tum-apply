package de.tum.cit.aet.core.service.export;

/**
 * Contract for contributing a portion of the user data export.
 */
public interface UserDataSectionProvider {
    void contribute(ExportContext context, UserDataExportBuilder builder);
}

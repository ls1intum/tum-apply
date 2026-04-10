package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.core.dto.exportdata.admin.AdminMemberRefDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminResearchGroupExportDTO;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.ZipExportService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Builds the research-groups portion of an admin bulk export. Embedded inside
 * the full admin export, where each research group becomes its own folder
 * containing member data and a {@code jobs/} subtree (added by the caller).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ResearchGroupsExportStrategy {

    private final ZipExportService zipExportService;
    private final AdminXlsxWriter xlsxWriter;
    private final ObjectMapper objectMapper;

    /**
     * Writes one research group's contents (member XLSX + machine-readable JSON)
     * into the supplied folder. The {@code jobs/} subtree is added by the caller.
     *
     * @param zos    open ZIP output stream
     * @param folder destination folder inside the ZIP, ending in {@code "/"}
     * @param rg     the research group to export
     */
    void writeGroupFolder(ZipOutputStream zos, String folder, ResearchGroup rg) {
        writeJsonEntry(zos, folder + "_machine_readable/research_group.json", toDto(rg));

        List<UserResearchGroupRole> roles = rg.getUserRoles() == null ? List.of() : new ArrayList<>(rg.getUserRoles());
        List<List<Object>> rows = new ArrayList<>(roles.size());
        for (UserResearchGroupRole role : roles) {
            User user = role.getUser();
            if (user == null) {
                continue;
            }
            rows.add(
                List.<Object>of(
                    nullSafe(user.getUserId()),
                    nullSafe(user.getLastName()),
                    nullSafe(user.getFirstName()),
                    nullSafe(user.getEmail()),
                    role.getRole() == null ? "" : role.getRole().name()
                )
            );
        }

        xlsxWriter.writeSheet(
            zos,
            folder + "members_overview.xlsx",
            "Members",
            List.of("User ID", "Last Name", "First Name", "Email", "Role"),
            rows
        );
    }

    AdminResearchGroupExportDTO toDto(ResearchGroup rg) {
        Set<UserResearchGroupRole> roles = rg.getUserRoles() == null ? Set.of() : rg.getUserRoles();
        List<AdminMemberRefDTO> memberRefs = roles
            .stream()
            .filter(r -> r.getUser() != null)
            .map(r ->
                new AdminMemberRefDTO(
                    r.getUser().getUserId(),
                    r.getUser().getFirstName(),
                    r.getUser().getLastName(),
                    r.getUser().getEmail(),
                    r.getRole()
                )
            )
            .toList();

        return new AdminResearchGroupExportDTO(
            rg.getResearchGroupId(),
            rg.getName(),
            rg.getAbbreviation(),
            rg.getHead(),
            rg.getEmail(),
            rg.getWebsite(),
            rg.getDepartment() == null ? null : rg.getDepartment().getDepartmentId(),
            rg.getDepartment() == null ? null : rg.getDepartment().getName(),
            rg.getDescription(),
            rg.getStreet(),
            rg.getPostalCode(),
            rg.getCity(),
            rg.getUniversityId(),
            rg.getState(),
            memberRefs,
            rg.getCreatedAt(),
            rg.getLastModifiedAt()
        );
    }

    /**
     * Writes a top-level research-groups overview workbook listing every group
     * with its core metadata. Called once per export from the orchestrator.
     *
     * @param zos       open ZIP output stream
     * @param entryPath path of the workbook entry inside the ZIP
     * @param groups    research groups to list
     */
    void writeOverviewSheet(ZipOutputStream zos, String entryPath, List<ResearchGroup> groups) {
        List<String> headers = List.of(
            "Research Group ID",
            "Name",
            "Abbreviation",
            "Head",
            "Email",
            "Website",
            "Department",
            "City",
            "Member Count",
            "State"
        );
        List<List<Object>> rows = new ArrayList<>(groups.size());
        for (ResearchGroup rg : groups) {
            rows.add(
                List.<Object>of(
                    nullSafe(rg.getResearchGroupId()),
                    nullSafe(rg.getName()),
                    nullSafe(rg.getAbbreviation()),
                    nullSafe(rg.getHead()),
                    nullSafe(rg.getEmail()),
                    nullSafe(rg.getWebsite()),
                    rg.getDepartment() == null ? "" : nullSafe(rg.getDepartment().getName()),
                    nullSafe(rg.getCity()),
                    rg.getUserRoles() == null ? 0 : rg.getUserRoles().size(),
                    rg.getState() == null ? "" : rg.getState().name()
                )
            );
        }
        xlsxWriter.writeSheet(zos, entryPath, "Research Groups", headers, rows);
    }

    private void writeJsonEntry(ZipOutputStream zos, String entryPath, Object payload) {
        try {
            byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
            zipExportService.addFileToZip(zos, entryPath, bytes);
        } catch (IOException e) {
            throw new UserDataExportException("Failed to write JSON entry " + entryPath, e);
        }
    }

    private static Object nullSafe(Object value) {
        return value == null ? "" : value;
    }
}

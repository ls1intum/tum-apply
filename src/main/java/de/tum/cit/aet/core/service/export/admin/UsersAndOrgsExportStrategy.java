package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.core.dto.exportdata.admin.AdminResearchGroupExportDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminUserExportDTO;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.ZipExportService;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.DepartmentDTO;
import de.tum.cit.aet.usermanagement.dto.SchoolShortDTO;
import de.tum.cit.aet.usermanagement.repository.DepartmentRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.SchoolRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipOutputStream;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Produces the {@link de.tum.cit.aet.core.constants.AdminExportType#USERS_AND_ORGS}
 * export: a lean JSON-only snapshot of the people and organisational
 * structure that can be used to re-seed the database after a hard reset.
 *
 * <p>Contents of the produced ZIP:
 * <pre>
 * users-and-orgs/
 * ├── manifest.json
 * └── _machine_readable/
 *     ├── schools.json
 *     ├── departments.json
 *     ├── research_groups.json
 *     ├── users.json
 *     └── user_research_group_roles.json
 * </pre>
 *
 * <p>No PDFs, no XLSX, no binary documents, no jobs and no applications —
 * this export is for disaster recovery / migration only. Jobs, applications
 * and documents are transient operational data that the full admin export
 * already covers; the users-and-orgs export is intentionally minimal so it
 * is fast to build and trivial to re-import.
 *
 * <p>The {@code user_research_group_roles.json} file mirrors the join-table
 * shape literally — one flat row per {@code (userId, researchGroupId, role)}
 * triple. Each user's roles are also embedded inside {@code users.json} for
 * convenience; the standalone file is there for re-import scripts that want
 * to {@code INSERT} straight into the {@code user_research_group_roles}
 * table without having to walk the nested users structure.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UsersAndOrgsExportStrategy {

    private final SchoolRepository schoolRepository;
    private final DepartmentRepository departmentRepository;
    private final ResearchGroupRepository researchGroupRepository;
    private final UserRepository userRepository;
    private final ResearchGroupsExportStrategy researchGroupsExportStrategy;
    private final ZipExportService zipExportService;
    private final ObjectMapper objectMapper;

    /**
     * Writes the five JSON dumps (schools, departments, research groups,
     * users and user↔research-group roles) into the supplied ZIP output
     * stream and records every entity in the manifest. The method is
     * intentionally simple: no per-job iteration, no lazy loading trickery,
     * no XLSX / PDF work — it just serialises five flat lists.
     *
     * @param zos      open ZIP output stream rooted at the export's top-level folder
     * @param manifest export-wide audit trail; schools, departments, research groups,
     *                 users and user-research-group roles are all recorded against it
     */
    public void exportUsersAndOrgs(@NonNull ZipOutputStream zos, @NonNull ExportManifest manifest) {
        writeSchools(zos, manifest);
        writeDepartments(zos, manifest);
        writeResearchGroups(zos, manifest);
        List<User> users = writeUsers(zos, manifest);
        writeUserResearchGroupRoles(zos, manifest, users);
    }

    private void writeSchools(ZipOutputStream zos, ExportManifest manifest) {
        List<School> schools = schoolRepository
            .findAll()
            .stream()
            .sorted(Comparator.comparing(School::getName, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
        manifest.expect(ExportManifest.Category.SCHOOL, schools.size());
        List<SchoolShortDTO> dtos = new ArrayList<>(schools.size());
        for (School school : schools) {
            try {
                dtos.add(SchoolShortDTO.fromEntity(school));
                manifest.exported(ExportManifest.Category.SCHOOL);
            } catch (Exception e) {
                log.warn("Failed to convert school {} for users-and-orgs export", school.getSchoolId(), e);
                manifest.failed(ExportManifest.Category.SCHOOL, school.getSchoolId(), school.getName(), e);
            }
        }
        writeJsonEntry(zos, "_machine_readable/schools.json", dtos);
    }

    private void writeDepartments(ZipOutputStream zos, ExportManifest manifest) {
        List<Department> departments = departmentRepository
            .findAll()
            .stream()
            .sorted(Comparator.comparing(Department::getName, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
        manifest.expect(ExportManifest.Category.DEPARTMENT, departments.size());
        List<DepartmentDTO> dtos = new ArrayList<>(departments.size());
        for (Department department : departments) {
            try {
                dtos.add(DepartmentDTO.fromEntity(department));
                manifest.exported(ExportManifest.Category.DEPARTMENT);
            } catch (Exception e) {
                log.warn("Failed to convert department {} for users-and-orgs export", department.getDepartmentId(), e);
                manifest.failed(ExportManifest.Category.DEPARTMENT, department.getDepartmentId(), department.getName(), e);
            }
        }
        writeJsonEntry(zos, "_machine_readable/departments.json", dtos);
    }

    private void writeResearchGroups(ZipOutputStream zos, ExportManifest manifest) {
        List<ResearchGroup> groups = researchGroupRepository
            .findAll()
            .stream()
            .sorted(Comparator.comparing(ResearchGroup::getName, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
        manifest.expect(ExportManifest.Category.RESEARCH_GROUP, groups.size());
        List<AdminResearchGroupExportDTO> dtos = new ArrayList<>(groups.size());
        for (ResearchGroup group : groups) {
            try {
                dtos.add(researchGroupsExportStrategy.toDto(group));
                manifest.exported(ExportManifest.Category.RESEARCH_GROUP);
            } catch (Exception e) {
                log.warn("Failed to convert research group {} for users-and-orgs export", group.getResearchGroupId(), e);
                manifest.failed(ExportManifest.Category.RESEARCH_GROUP, group.getResearchGroupId(), group.getName(), e);
            }
        }
        writeJsonEntry(zos, "_machine_readable/research_groups.json", dtos);
    }

    private List<User> writeUsers(ZipOutputStream zos, ExportManifest manifest) {
        List<User> users = userRepository
            .findAll()
            .stream()
            .sorted(Comparator.comparing(User::getLastName, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
        manifest.expect(ExportManifest.Category.USER, users.size());
        List<AdminUserExportDTO> dtos = new ArrayList<>(users.size());
        for (User user : users) {
            try {
                dtos.add(AdminUserExportDTO.getFromEntity(user));
                manifest.exported(ExportManifest.Category.USER);
            } catch (Exception e) {
                log.warn("Failed to convert user {} for users-and-orgs export", user.getUserId(), e);
                manifest.failed(ExportManifest.Category.USER, user.getUserId(), user.getEmail(), e);
            }
        }
        writeJsonEntry(zos, "_machine_readable/users.json", dtos);
        return users;
    }

    /**
     * Writes a flat dump of the {@code user_research_group_roles} join table:
     * one row per {@code (userId, researchGroupId, role)} triple, straight
     * from {@link User#getResearchGroupRoles()}. The join row's own primary
     * key is intentionally omitted — it is opaque, nothing downstream
     * references it, and re-import will generate fresh UUIDs.
     *
     * @param zos       open ZIP output stream
     * @param manifest  audit trail; every role row is recorded individually
     * @param users     the users loaded by {@link #writeUsers} (reused so we
     *                  don't hit the repository twice)
     */
    private void writeUserResearchGroupRoles(ZipOutputStream zos, ExportManifest manifest, List<User> users) {
        List<UserResearchGroupRoleRow> rows = new ArrayList<>();
        for (User user : users) {
            if (user.getResearchGroupRoles() == null) {
                continue;
            }
            for (UserResearchGroupRole role : user.getResearchGroupRoles()) {
                manifest.expect(ExportManifest.Category.USER_RESEARCH_GROUP_ROLE, 1);
                try {
                    rows.add(
                        new UserResearchGroupRoleRow(
                            user.getUserId(),
                            role.getResearchGroup() == null ? null : role.getResearchGroup().getResearchGroupId(),
                            role.getRole()
                        )
                    );
                    manifest.exported(ExportManifest.Category.USER_RESEARCH_GROUP_ROLE);
                } catch (Exception e) {
                    log.warn(
                        "Failed to convert user_research_group_role {} for users-and-orgs export",
                        role.getUserResearchGroupRoleId(),
                        e
                    );
                    manifest.failed(
                        ExportManifest.Category.USER_RESEARCH_GROUP_ROLE,
                        role.getUserResearchGroupRoleId(),
                        user.getEmail(),
                        e
                    );
                }
            }
        }
        writeJsonEntry(zos, "_machine_readable/user_research_group_roles.json", rows);
    }

    /**
     * Flat representation of one row in the {@code user_research_group_roles}
     * join table. Intentionally nested inside the strategy — this shape is
     * only used by the users-and-orgs export and doesn't justify a top-level
     * DTO.
     */
    private record UserResearchGroupRoleRow(UUID userId, UUID researchGroupId, UserRole role) {}

    private void writeJsonEntry(ZipOutputStream zos, String entryPath, Object payload) {
        try {
            byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
            zipExportService.addFileToZip(zos, entryPath, bytes);
        } catch (IOException e) {
            throw new UserDataExportException("Failed to write JSON entry " + entryPath, e);
        }
    }
}

package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminApplicationExportDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminJobExportDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminUserExportDTO;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.ZipExportService;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.UserDTO;
import de.tum.cit.aet.usermanagement.dto.UserResearchGroupRoleDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Composes the full admin export ZIP. Only research groups in state
 * {@link ResearchGroupState#ACTIVE} are included; each one becomes a top-level
 * folder containing its members and a {@code jobs/} subtree split by job state
 * (open / expired / closed / drafts). Jobs that have no research group at all
 * land in {@code orphans/jobs/}, and the top-level {@code _machine_readable/}
 * folder carries flat JSON dumps of every entity for re-import.
 *
 * <p>Top level structure produced:
 * <pre>
 * admin_full/
 * ├── README_ADMIN_EXPORT_*.txt
 * ├── _machine_readable/
 * │   ├── jobs.json
 * │   ├── applications.json
 * │   ├── users.json
 * │   └── research_groups.json
 * ├── research_groups_overview.xlsx
 * ├── &lt;abbrev&gt;/                                  (UUID-free; ids are in the JSON)
 * │   ├── _machine_readable/research_group.json
 * │   ├── members_overview.xlsx
 * │   └── jobs/
 * │       ├── open/
 * │       │   ├── jobs_overview.xlsx
 * │       │   ├── _machine_readable/jobs.json
 * │       │   └── job_&lt;slug&gt;/...
 * │       ├── expired/...
 * │       ├── closed/...
 * │       └── drafts/...
 * └── orphans/
 *     └── jobs/...   (jobs with no research group; usually empty)
 * </pre>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FullAdminExportStrategy {

    private final JobsExportStrategy jobsExportStrategy;
    private final ResearchGroupsExportStrategy researchGroupsExportStrategy;
    private final ResearchGroupRepository researchGroupRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ZipExportService zipExportService;
    private final ObjectMapper objectMapper;

    /**
     * Builds the full admin export into the supplied ZIP output stream.
     *
     * @param zos      open ZIP output stream rooted at the export's top-level folder
     * @param manifest export-wide audit trail recording every entity that makes it into the ZIP
     */
    public void exportFull(ZipOutputStream zos, ExportManifest manifest) {
        // 1. Active research groups only — DRAFT and DENIED groups are excluded by design.
        List<ResearchGroup> allRgs = researchGroupRepository.findAll();
        List<ResearchGroup> groups = allRgs
            .stream()
            .filter(rg -> rg.getState() == ResearchGroupState.ACTIVE)
            .sorted(Comparator.comparing(ResearchGroup::getName, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
        if (log.isDebugEnabled()) {
            log.debug(
                "Full admin export: {} research groups in DB, {} are ACTIVE and will be included. Excluded by state: {}",
                allRgs.size(),
                groups.size(),
                allRgs
                    .stream()
                    .filter(rg -> rg.getState() != ResearchGroupState.ACTIVE)
                    .map(rg -> rg.getName() + "[" + rg.getState() + "]")
                    .toList()
            );
        }

        // Pre-group all jobs by research group id so each group folder can read its own list once.
        List<Job> allJobs = jobRepository.findAll();
        Map<UUID, List<Job>> jobsByRg = allJobs
            .stream()
            .filter(j -> j.getResearchGroup() != null)
            .collect(Collectors.groupingBy(j -> j.getResearchGroup().getResearchGroupId()));

        manifest.expect(ExportManifest.Category.RESEARCH_GROUP, groups.size());

        // No UUID suffixes in folder names — every entity's id is already in
        // the JSON files inside _machine_readable/. Slug collisions (same
        // abbreviation/title twice) are handled by an auto-incrementing suffix.
        FolderNameAllocator rgAllocator = new FolderNameAllocator(false);
        for (ResearchGroup rg : groups) {
            // Use the full research group title; abbreviations collide too easily
            // ("AET", null, …) and the slug() helper trims it to a safe length.
            String rgFolder = rgAllocator.allocate(rg.getName(), rg.getResearchGroupId()) + "/";
            try {
                researchGroupsExportStrategy.writeGroupFolder(zos, rgFolder, rg, true);
                manifest.exported(ExportManifest.Category.RESEARCH_GROUP);
            } catch (JobsExportStrategy.StreamAbortedException sae) {
                throw sae;
            } catch (Exception e) {
                log.warn("Failed to write research group folder for {}", rg.getResearchGroupId(), e);
                manifest.failed(ExportManifest.Category.RESEARCH_GROUP, rg.getResearchGroupId(), rg.getName(), e);
                JobsExportStrategy.rethrowIfStreamBroken(e);
            }

            List<Job> rgJobs = jobsByRg.getOrDefault(rg.getResearchGroupId(), List.of());
            if (rgJobs.isEmpty()) {
                continue;
            }

            // Split this research group's jobs into the four state buckets.
            List<Job> openJobs = jobsExportStrategy.filterJobs(rgJobs, AdminExportType.JOBS_OPEN);
            List<Job> expiredJobs = jobsExportStrategy.filterJobs(rgJobs, AdminExportType.JOBS_EXPIRED);
            List<Job> closedJobs = jobsExportStrategy.filterJobs(rgJobs, AdminExportType.JOBS_CLOSED);
            List<Job> draftJobs = rgJobs
                .stream()
                .filter(j -> j.getState() == JobState.DRAFT)
                .toList();

            // Full admin is the comprehensive backup — every bucket includes
            // SAVED applications too so nothing is silently dropped.
            writeBucket(zos, rgFolder + "jobs/open/", openJobs, true, manifest);
            writeBucket(zos, rgFolder + "jobs/expired/", expiredJobs, true, manifest);
            writeBucket(zos, rgFolder + "jobs/closed/", closedJobs, true, manifest);
            writeBucket(zos, rgFolder + "jobs/drafts/", draftJobs, true, manifest);
        }

        // 2. Top-level research groups overview workbook (only ACTIVE groups, matches the loop above).
        researchGroupsExportStrategy.writeOverviewSheet(zos, "research_groups_overview.xlsx", groups);

        // 3. Orphan jobs (no research group) — defensive; healthy data should leave this empty.
        List<Job> orphanJobs = allJobs
            .stream()
            .filter(j -> j.getResearchGroup() == null)
            .toList();
        if (!orphanJobs.isEmpty()) {
            jobsExportStrategy.writeJobsInto(zos, "orphans/jobs/", orphanJobs, true, false, true, manifest);
        }

        // 4. Top-level machine-readable dumps — flat lists of every entity (not state-filtered).
        List<AdminJobExportDTO> jobDtos = allJobs.stream().map(jobsExportStrategy::toJobDto).toList();
        writeJsonEntry(zos, "_machine_readable/jobs.json", jobDtos);

        List<Application> allApplications = applicationRepository.findAll();
        List<AdminApplicationExportDTO> appDtos = allApplications.stream().map(jobsExportStrategy::toApplicationDto).toList();
        writeJsonEntry(zos, "_machine_readable/applications.json", appDtos);

        List<de.tum.cit.aet.usermanagement.domain.User> allUsers = userRepository.findAll();
        manifest.expect(ExportManifest.Category.USER, allUsers.size());
        List<AdminUserExportDTO> userDtos = allUsers
            .stream()
            .map(u -> {
                try {
                    AdminUserExportDTO dto = toUserDto(u);
                    manifest.exported(ExportManifest.Category.USER);
                    return dto;
                } catch (Exception e) {
                    manifest.failed(ExportManifest.Category.USER, u.getUserId(), u.getEmail(), e);
                    return null;
                }
            })
            .filter(java.util.Objects::nonNull)
            .toList();
        writeJsonEntry(zos, "_machine_readable/users.json", userDtos);

        writeJsonEntry(zos, "_machine_readable/research_groups.json", groups.stream().map(researchGroupsExportStrategy::toDto).toList());
    }

    private void writeBucket(ZipOutputStream zos, String basePath, List<Job> jobs, boolean includeAllStates, ExportManifest manifest) {
        if (jobs.isEmpty()) {
            return;
        }
        // includeUuids=false: folder names stay clean; UUIDs live only in the JSON files.
        // includeJsonDumps=true: full admin keeps every machine-readable file for re-import.
        // includeAllStates is passed through: full admin backup keeps every
        // application state including SAVED/WITHDRAWN/etc.
        jobsExportStrategy.writeJobsInto(zos, basePath, jobs, includeAllStates, false, true, manifest);
    }

    private AdminUserExportDTO toUserDto(User user) {
        List<UserResearchGroupRoleDTO> roles =
            user.getResearchGroupRoles() == null
                ? List.of()
                : user.getResearchGroupRoles().stream().map(UserResearchGroupRoleDTO::getFromEntity).toList();

        return new AdminUserExportDTO(
            UserDTO.getFromEntity(user),
            user.getUniversityId(),
            user.getLastActivityAt(),
            user.isAiFeaturesEnabled(),
            user.getAiConsentedAt(),
            roles,
            user.getCreatedAt(),
            user.getLastModifiedAt()
        );
    }

    private void writeJsonEntry(ZipOutputStream zos, String entryPath, Object payload) {
        try {
            byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
            zipExportService.addFileToZip(zos, entryPath, bytes);
        } catch (IOException e) {
            throw new UserDataExportException("Failed to write JSON entry " + entryPath, e);
        }
    }
}

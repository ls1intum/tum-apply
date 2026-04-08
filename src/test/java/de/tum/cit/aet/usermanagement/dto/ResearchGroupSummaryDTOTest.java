package de.tum.cit.aet.usermanagement.dto;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ResearchGroupSummaryDTOTest {

    @Test
    void shouldMapAllFieldsFromEntity() {
        Department department = new Department();
        department.setName("Computer Science");

        ResearchGroup group = new ResearchGroup();
        group.setResearchGroupId(UUID.randomUUID());
        group.setName("Machine Learning Lab");
        group.setDescription("<p>We research ML</p>");
        group.setDepartment(department);
        group.setEmail("ml@tum.de");
        group.setWebsite("https://ml.tum.de");
        group.setStreet("Arcisstr. 21");
        group.setPostalCode("80333");
        group.setCity("Munich");

        ResearchGroupSummaryDTO dto = ResearchGroupSummaryDTO.getFromEntity(group);

        assertThat(dto).isNotNull();
        assertThat(dto.researchGroupId()).isEqualTo(group.getResearchGroupId());
        assertThat(dto.name()).isEqualTo("Machine Learning Lab");
        assertThat(dto.description()).isEqualTo("<p>We research ML</p>");
        assertThat(dto.departmentName()).isEqualTo("Computer Science");
        assertThat(dto.email()).isEqualTo("ml@tum.de");
        assertThat(dto.website()).isEqualTo("https://ml.tum.de");
        assertThat(dto.street()).isEqualTo("Arcisstr. 21");
        assertThat(dto.postalCode()).isEqualTo("80333");
        assertThat(dto.city()).isEqualTo("Munich");
    }

    @Test
    void shouldSanitizeDescriptionOnRead() {
        ResearchGroup group = new ResearchGroup();
        group.setResearchGroupId(UUID.randomUUID());
        group.setName("Test Group");
        group.setDescription("<p>Safe content</p><script>alert('xss')</script>");

        ResearchGroupSummaryDTO dto = ResearchGroupSummaryDTO.getFromEntity(group);

        assertThat(dto.description()).contains("Safe content");
        assertThat(dto.description()).doesNotContain("<script");
        assertThat(dto.description()).doesNotContain("alert");
    }

    @Test
    void shouldPreserveQuillAlignmentInDescription() {
        ResearchGroup group = new ResearchGroup();
        group.setResearchGroupId(UUID.randomUUID());
        group.setName("Test Group");
        group.setDescription("<p class=\"ql-align-center\">Centered text</p>");

        ResearchGroupSummaryDTO dto = ResearchGroupSummaryDTO.getFromEntity(group);

        assertThat(dto.description()).contains("ql-align-center");
        assertThat(dto.description()).contains("Centered text");
    }

    @Test
    void shouldReturnNullForNullEntity() {
        assertThat(ResearchGroupSummaryDTO.getFromEntity(null)).isNull();
    }

    @Test
    void shouldHandleNullDepartment() {
        ResearchGroup group = new ResearchGroup();
        group.setResearchGroupId(UUID.randomUUID());
        group.setName("No Department Group");
        group.setDepartment(null);

        ResearchGroupSummaryDTO dto = ResearchGroupSummaryDTO.getFromEntity(group);

        assertThat(dto).isNotNull();
        assertThat(dto.departmentName()).isNull();
        assertThat(dto.name()).isEqualTo("No Department Group");
    }

    @Test
    void shouldHandleNullDescription() {
        ResearchGroup group = new ResearchGroup();
        group.setResearchGroupId(UUID.randomUUID());
        group.setName("Group");
        group.setDescription(null);

        ResearchGroupSummaryDTO dto = ResearchGroupSummaryDTO.getFromEntity(group);

        assertThat(dto.description()).isNull();
    }

    @Test
    void shouldStripNonQuillClassesFromDescription() {
        ResearchGroup group = new ResearchGroup();
        group.setResearchGroupId(UUID.randomUUID());
        group.setName("Group");
        group.setDescription("<p class=\"malicious ql-align-right\">Text</p>");

        ResearchGroupSummaryDTO dto = ResearchGroupSummaryDTO.getFromEntity(group);

        assertThat(dto.description()).contains("ql-align-right");
        assertThat(dto.description()).doesNotContain("malicious");
        assertThat(dto.description()).contains("Text");
    }
}

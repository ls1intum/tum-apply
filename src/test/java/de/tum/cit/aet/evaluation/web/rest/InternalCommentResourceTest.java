package de.tum.cit.aet.evaluation.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.evaluation.dto.InternalCommentDTO;
import de.tum.cit.aet.evaluation.dto.InternalCommentUpdateDTO;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InternalCommentResourceTest extends AbstractResourceTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    ApplicantRepository applicantRepository;

    @Autowired
    JobRepository jobRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    InternalCommentRepository internalCommentRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    User professor;
    User otherProfessor;
    ResearchGroup researchGroup;
    Applicant applicant;
    Job publishedJob;
    Application application;
    InternalComment existingComment;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, researchGroup);
        otherProfessor = UserTestData.savedProfessor(userRepository, researchGroup);

        applicant = ApplicantTestData.savedWithNewUser(applicantRepository);

        publishedJob = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Role X",
            JobState.PUBLISHED,
            LocalDate.now().plusDays(14)
        );

        application = ApplicationTestData.savedInReview(applicationRepository, publishedJob, applicant);

        existingComment = InternalCommentTestData.saved(internalCommentRepository, application, professor);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void listCommentsReturnsOrderedList() {
        internalCommentRepository.save(InternalCommentTestData.newCommentAll(application, professor, "first"));
        internalCommentRepository.save(InternalCommentTestData.newCommentAll(application, professor, "second"));

        String url = "/api/applications/" + application.getApplicationId() + "/comments";

        List<InternalCommentDTO> list = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(url, Map.of(), new TypeReference<>() {}, 200);

        assertThat(list).isNotEmpty();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void listCommentsNonexistentApplicationReturns404() {
        UUID fakeAppId = UUID.randomUUID();
        String url = "/api/applications/" + fakeAppId + "/comments";

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR")).getAndRead(url, Map.of(), Void.class, 404);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void createCommentReturns201() {
        InternalCommentUpdateDTO payload = new InternalCommentUpdateDTO("hello world");
        String url = "/api/applications/" + application.getApplicationId() + "/comments";

        InternalCommentDTO created = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(url, payload, InternalCommentDTO.class, 201);

        assertThat(created.message()).isEqualTo("hello world");
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void createCommentNonexistentApplicationReturns404() {
        UUID fakeAppId = UUID.randomUUID();
        String url = "/api/applications/" + fakeAppId + "/comments";

        InternalCommentUpdateDTO payload = new InternalCommentUpdateDTO("ghost");

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR")).postAndRead(url, payload, Void.class, 404);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateCommentOwnCommentReturns200() {
        InternalCommentUpdateDTO payload = new InternalCommentUpdateDTO("updated");
        String url = "/api/comments/" + existingComment.getInternalCommentId();

        InternalCommentDTO updated = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(url, payload, InternalCommentDTO.class, 200);

        assertThat(updated.message()).isEqualTo("updated");
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateNonexistentCommentReturns404() {
        UUID fakeId = UUID.randomUUID();
        String url = "/api/comments/" + fakeId;

        api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(url, new InternalCommentUpdateDTO("does not exist"), Void.class, 404);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void deleteComment_ownComment_returns204() {
        String url = "/api/comments/" + existingComment.getInternalCommentId();

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR")).deleteAndRead(url, null, Void.class, 204);

        assertThat(internalCommentRepository.findById(existingComment.getInternalCommentId())).isEmpty();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void deleteNonexistentCommentReturns404() {
        UUID fakeId = UUID.randomUUID();
        String url = "/api/comments/" + fakeId;

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR")).deleteAndRead(url, null, Void.class, 404);
    }

    @Test
    void listCommentsUnauthenticatedReturns401() {
        String url = "/api/applications/" + application.getApplicationId() + "/comments";
        api.withoutPostProcessors().getAndRead(url, Map.of(), Void.class, 401);
    }

    @Test
    void createCommentUnauthenticatedReturns401() {
        String url = "/api/applications/" + application.getApplicationId() + "/comments";
        api.withoutPostProcessors().postAndRead(url, new InternalCommentUpdateDTO("x"), Void.class, 401);
    }

    @Test
    void updateCommentUnauthenticatedReturns401() {
        String url = "/api/comments/" + existingComment.getInternalCommentId();
        api.withoutPostProcessors().putAndRead(url, new InternalCommentUpdateDTO("x"), Void.class, 401);
    }

    @Test
    void deleteCommentUnauthenticatedReturns401() {
        String url = "/api/comments/" + existingComment.getInternalCommentId();
        api.withoutPostProcessors().deleteAndRead(url, null, Void.class, 401);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateComment_asDifferentProfessor_returns403() {
        String url = "/api/comments/" + existingComment.getInternalCommentId();

        api
            .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(url, new InternalCommentUpdateDTO("illegal"), Void.class, 403);
    }

    @Test
    @WithMockUser
    void allEndpoints_withoutProfessorRole_return403() {
        String createPostUrl = "/api/applications/" + application.getApplicationId() + "/comments";
        String updateDeleteUrl = "/api/comments/" + existingComment.getInternalCommentId();

        api.getAndRead(createPostUrl, Map.of(), Void.class, 403);

        api.postAndRead(createPostUrl, new InternalCommentUpdateDTO("x"), Void.class, 403);

        api.putAndRead(updateDeleteUrl, new InternalCommentUpdateDTO("x"), Void.class, 403);

        api.deleteAndRead(updateDeleteUrl, null, Void.class, 403);
    }
}

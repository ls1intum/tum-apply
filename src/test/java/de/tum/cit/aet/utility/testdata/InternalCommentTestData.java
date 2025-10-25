package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;

/**
 * Test data helpers for InternalComment.
 */
public final class InternalCommentTestData {

    private InternalCommentTestData() {}

    /** Unsaved InternalComment with defaults (message + professor). */
    public static InternalComment newComment(Application application, User professor) {
        InternalComment c = new InternalComment();
        c.setApplication(application);
        c.setCreatedBy(professor);
        c.setMessage("This is a test internal comment.");
        return c;
    }

    /** Unsaved InternalComment with override options (null = keep default). */
    public static InternalComment newCommentAll(Application application, User professor, String message) {
        InternalComment c = newComment(application, professor);
        if (message != null) c.setMessage(message);
        if (application != null) c.setApplication(application);
        if (professor != null) c.setCreatedBy(professor);
        return c;
    }

    // --- Saved variants -------------------------------------------------------------------------

    /**
     * Saves a new InternalComment with given Application and Professor.
     */
    public static InternalComment saved(InternalCommentRepository repo, Application application, User professor) {
        return repo.save(newComment(application, professor));
    }

    /**
     * Saves a new InternalComment with a freshly created professor and given Application.
     */
    public static InternalComment savedWithNewProfessor(
        InternalCommentRepository repo,
        UserRepository userRepo,
        ResearchGroup rg,
        Application application
    ) {
        User professor = UserTestData.savedProfessor(userRepo, rg);
        return saved(repo, application, professor);
    }
}

package de.tum.cit.aet.reference.dto;

import de.tum.cit.aet.reference.constants.AcquaintanceDepth;
import de.tum.cit.aet.reference.constants.AcquaintanceDuration;
import de.tum.cit.aet.reference.constants.OverallRecommendation;
import de.tum.cit.aet.reference.constants.PeerRating;
import de.tum.cit.aet.reference.constants.RefereeRelationship;
import jakarta.validation.constraints.NotNull;

/**
 * The structured assessment a referee submits alongside the recommendation letter PDF. Every field is
 * mandatory: the upload page does not let a referee submit until all questions are answered, and
 * {@link PeerRating#CANNOT_JUDGE} is the escape hatch for a dimension they cannot rate.
 *
 * @param relationship             capacity in which the referee knows the applicant
 * @param acquaintanceDuration     how long the referee has known the applicant
 * @param acquaintanceDepth        how well the referee knows the applicant
 * @param ratingIntellectualAbility peer-group rating of intellectual ability
 * @param ratingResearchPotential  peer-group rating of research potential
 * @param ratingMotivation         peer-group rating of motivation and drive
 * @param ratingCommunication      peer-group rating of communication skills
 * @param ratingLeadership         peer-group rating of leadership
 * @param ratingCollaboration      peer-group rating of ability to collaborate
 * @param overallRecommendation    the referee's overall endorsement
 */
public record ReferenceLetterSubmissionDTO(
    @NotNull RefereeRelationship relationship,
    @NotNull AcquaintanceDuration acquaintanceDuration,
    @NotNull AcquaintanceDepth acquaintanceDepth,
    @NotNull PeerRating ratingIntellectualAbility,
    @NotNull PeerRating ratingResearchPotential,
    @NotNull PeerRating ratingMotivation,
    @NotNull PeerRating ratingCommunication,
    @NotNull PeerRating ratingLeadership,
    @NotNull PeerRating ratingCollaboration,
    @NotNull OverallRecommendation overallRecommendation
) {}

package de.tum.cit.aet.reference.web;

import de.tum.cit.aet.core.security.annotations.Public;
import de.tum.cit.aet.reference.constants.AcquaintanceDepth;
import de.tum.cit.aet.reference.constants.AcquaintanceDuration;
import de.tum.cit.aet.reference.constants.OverallRecommendation;
import de.tum.cit.aet.reference.constants.PeerRating;
import de.tum.cit.aet.reference.constants.RefereeRelationship;
import de.tum.cit.aet.reference.dto.ReferenceLetterSubmissionDTO;
import de.tum.cit.aet.reference.dto.ReferenceLetterUploadContextDTO;
import de.tum.cit.aet.reference.dto.ReferenceRequestDTO;
import de.tum.cit.aet.reference.service.ReferenceRequestService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Public endpoints used by external referees to open their tokenized invitation link and upload
 * a recommendation letter. The token in the URL is the only authentication — these endpoints are
 * therefore whitelisted in {@code SecurityConfiguration} and use the {@link Public} annotation.
 */
@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/reference-letters")
public class ReferenceLetterUploadResource {

    private final ReferenceRequestService referenceRequestService;

    /**
     * Resolves the prefill context the upload page renders for the referee
     * (the applicant, the job, the deadline and the request status).
     *
     * @param token the raw token from the invitation email
     * @return the context, or 404 if the token is unknown
     */
    @Public
    @GetMapping("/{token}")
    public ResponseEntity<ReferenceLetterUploadContextDTO> getContext(@PathVariable String token) {
        log.info("GET /api/reference-letters/{} - Resolving token context", maskToken(token));
        return ResponseEntity.ok(referenceRequestService.getContextByToken(token));
    }

    /**
     * Persists the uploaded PDF together with the referee's structured assessment answers and marks
     * the request as submitted. Every assessment field is required, so a missing or unknown value
     * results in a 400. Returns 400 too when the request is no longer accepting uploads (already
     * submitted or expired).
     *
     * @param token                     the raw token from the invitation email
     * @param file                      the PDF the referee selected
     * @param relationship              capacity in which the referee knows the applicant
     * @param acquaintanceDuration      how long the referee has known the applicant
     * @param acquaintanceDepth         how well the referee knows the applicant
     * @param ratingIntellectualAbility peer-group rating of intellectual ability
     * @param ratingResearchPotential   peer-group rating of research potential
     * @param ratingMotivation          peer-group rating of motivation and drive
     * @param ratingCommunication       peer-group rating of communication skills
     * @param ratingLeadership          peer-group rating of leadership
     * @param ratingCollaboration       peer-group rating of ability to collaborate
     * @param overallRecommendation     the referee's overall endorsement
     * @return the updated reference request DTO
     */
    @Public
    @PostMapping(value = "/{token}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReferenceRequestDTO> upload(
        @PathVariable String token,
        @RequestParam("file") MultipartFile file,
        @RequestParam RefereeRelationship relationship,
        @RequestParam AcquaintanceDuration acquaintanceDuration,
        @RequestParam AcquaintanceDepth acquaintanceDepth,
        @RequestParam PeerRating ratingIntellectualAbility,
        @RequestParam PeerRating ratingResearchPotential,
        @RequestParam PeerRating ratingMotivation,
        @RequestParam PeerRating ratingCommunication,
        @RequestParam PeerRating ratingLeadership,
        @RequestParam PeerRating ratingCollaboration,
        @RequestParam OverallRecommendation overallRecommendation
    ) {
        log.info("POST /api/reference-letters/{} - Uploading letter {}", maskToken(token), file.getOriginalFilename());
        ReferenceLetterSubmissionDTO assessment = new ReferenceLetterSubmissionDTO(
            relationship,
            acquaintanceDuration,
            acquaintanceDepth,
            ratingIntellectualAbility,
            ratingResearchPotential,
            ratingMotivation,
            ratingCommunication,
            ratingLeadership,
            ratingCollaboration,
            overallRecommendation
        );
        return ResponseEntity.ok(referenceRequestService.uploadLetter(token, file, assessment));
    }

    /**
     * Returns a short prefix of the token so logs remain useful for debugging without leaking the full credential.
     *
     * @param token the raw token to mask
     * @return a short prefix safe to log
     */
    private static String maskToken(String token) {
        if (token == null || token.length() <= 6) {
            return "***";
        }
        return token.substring(0, 6) + "…";
    }
}

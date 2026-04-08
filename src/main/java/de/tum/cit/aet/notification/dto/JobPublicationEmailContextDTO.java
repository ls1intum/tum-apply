package de.tum.cit.aet.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;

/**
 * DTO that holds the context data needed to render job publication notification emails.
 *
 * @param user the recipient user
 * @param job  the published job
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobPublicationEmailContextDTO(User user, Job job) {}

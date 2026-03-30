package de.tum.cit.aet.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobPublicationEmailContext(User user, Job job) {}

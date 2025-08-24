package de.tum.cit.aet.notification.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailSetting;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailSettingRepository extends TumApplyJpaRepository<EmailSetting, UUID> {
    /**
     * Finds an email setting for a specific user and email type combination.
     *
     * @param user the user to search email settings for
     * @param emailType the specific email type to find settings for
     * @return Optional containing the EmailSetting if found, empty otherwise
     */
    Optional<EmailSetting> findByUserAndEmailType(User user, EmailType emailType);

    /**
     * Retrieves all email settings for a specific user.
     *
     * @param user the user to retrieve all email settings for
     * @return a set of all EmailSetting entities associated with the user
     */
    Set<EmailSetting> findAllByUser(User user);

    /**
     * Finds all available email types that a user has settings configured for.
     *
     * @param user the user to find available email types for
     * @return a set of EmailType values that the user has settings configured for
     */
    @Query(
        """
        select es.emailType
        from EmailSetting es
        where es.user = :user
        """
    )
    Set<EmailType> findAvailableEmailTypesForUser(@Param("user") User user);
}

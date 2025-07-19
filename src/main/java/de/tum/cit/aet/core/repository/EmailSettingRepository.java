package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.domain.EmailSetting;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailSettingRepository extends TumApplyJpaRepository<EmailSetting, UUID> {
    Optional<EmailSetting> findByUserAndEmailType(User user, EmailType emailType);

    Set<EmailSetting> findAllByUser(User user);

    @Query(
        """
        select es.emailType
        from EmailSetting es
        where es.user = :user
        """
    )
    Set<EmailType> findAvailableEmailTypesForUser(@Param("user") User user);
}

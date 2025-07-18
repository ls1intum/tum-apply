package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.domain.EmailSetting;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailSettingRepository extends TumApplyJpaRepository<EmailSetting, UUID> {
    EmailSetting findByUserAndEmailType(User user, EmailType emailType);
}

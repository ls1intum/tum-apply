package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {}

// Commented out, because the UserRepository should be in the usermanagement/repository directory
// package de.tum.cit.aet.core.repository;
//
//import de.tum.cit.aet.core.exception.EntityNotFoundException;
//import de.tum.cit.aet.usermanagement.domain.User;
//import java.util.UUID;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.stereotype.Repository;
//
/// **
// * Spring Data JPA repository for the {@link User} entity.
// */
//@Repository
//public interface UserRepository extends TumApplyJpaRepository<User, UUID> {
//    String USERS_BY_LOGIN_CACHE = "usersByLogin";
//
//    String USERS_BY_EMAIL_CACHE = "usersByEmail";
//
//    /* Commented out to make application run and adapt to new User Entity
//
//    Optional<User> findOneByLogin(String login);
//
//    @EntityGraph(attributePaths = "authorities")
//    @Cacheable(cacheNames = USERS_BY_LOGIN_CACHE, unless = "#result == null")
//    Optional<User> findOneWithAuthoritiesByLogin(String login);
//
//
//
//    Page<User> findAllByIdNotNullAndActivatedIsTrue(Pageable pageable);
//
//     */
//    default User findByIdElseThrow(UUID id) {
//        return findById(id).orElseThrow(() -> new EntityNotFoundException("User with id " + id + " does not exist"));
//    }
//}

package de.tum.cit.aet.core.service.mapper;

import de.tum.cit.aet.core.domain.Authority;
import de.tum.cit.aet.core.service.dto.AdminUserDTO;
import de.tum.cit.aet.core.service.dto.UserDTO;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.*;
import java.util.stream.Collectors;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.stereotype.Service;

/**
 * Mapper for the entity {@link User} and its DTO called {@link UserDTO}.
 * <p>
 * Normal mappers are generated using MapStruct, this one is hand-coded as MapStruct
 * support is still in beta, and requires a manual step with an IDE.
 */
@Service
public class UserMapper {

    public List<UserDTO> usersToUserDTOs(List<User> users) {
        return users.stream().filter(Objects::nonNull).map(this::userToUserDTO).toList();
    }

    public UserDTO userToUserDTO(User user) {
        return new UserDTO(user);
    }

    public List<AdminUserDTO> usersToAdminUserDTOs(List<User> users) {
        return users.stream().filter(Objects::nonNull).map(this::userToAdminUserDTO).toList();
    }

    public AdminUserDTO userToAdminUserDTO(User user) {
        return new AdminUserDTO(user);
    }

    public List<User> userDTOsToUsers(List<AdminUserDTO> userDTOs) {
        return userDTOs.stream().filter(Objects::nonNull).map(this::userDTOToUser).toList();
    }

    /**
     * Converts a UserDTO to a User entity.
     *
     * @param userDTO the UserDTO to convert
     * @return the converted User entity
     */
    public User userDTOToUser(AdminUserDTO userDTO) {
        if (userDTO == null) {
            return null;
        } else {
            User user = new User();
            //TODO: Adjust this code after Database Entities have been created
            //            user.setId(userDTO.getId());
            //            user.setLogin(userDTO.getLogin());
            //            user.setFirstName(userDTO.getFirstName());
            //            user.setLastName(userDTO.getLastName());
            //            user.setEmail(userDTO.getEmail());
            //            user.setImageUrl(userDTO.getImageUrl());
            //            user.setCreatedBy(userDTO.getCreatedBy());
            //            user.setCreatedDate(userDTO.getCreatedDate());
            //            user.setLastModifiedBy(userDTO.getLastModifiedBy());
            //            user.setLastModifiedDate(userDTO.getLastModifiedDate());
            //            user.setActivated(userDTO.isActivated());
            //            user.setLangKey(userDTO.getLangKey());
            //            Set<Authority> authorities = this.authoritiesFromStrings(userDTO.getAuthorities());
            //            user.setAuthorities(authorities);
            return user;
        }
    }

    private Set<Authority> authoritiesFromStrings(Set<String> authoritiesAsString) {
        Set<Authority> authorities = new HashSet<>();

        if (authoritiesAsString != null) {
            authorities = authoritiesAsString
                .stream()
                .map(string -> {
                    Authority auth = new Authority();
                    auth.setName(string);
                    return auth;
                })
                .collect(Collectors.toSet());
        }

        return authorities;
    }

    /**
     * Converts a User entity to a UserDTO, only including the id field.
     *
     * @param id the id of the User entity
     * @return a UserDTO with only the id field
     */
    public User userFromId(String id) {
        if (id == null) {
            return null;
        }
        User user = new User();
        //TODO: Adjust this code after Database Entities have been created
        //        user.setId(id);
        return user;
    }

    /**
     * Converts a User entity to a UserDTO, only including the id field.
     *
     * @param user the User entity to convert
     * @return a UserDTO with only the id field
     */
    @Named("id")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    public UserDTO toDtoId(User user) {
        if (user == null) {
            return null;
        }
        UserDTO userDto = new UserDTO();
        //TODO: Adjust this code after Database Entities have been created
        //        userDto.setId(user.getId());
        return userDto;
    }

    /**
     * Converts a Set of User entities to a Set of UserDTOs, only including the id field.
     *
     * @param users the Set of User entities to convert
     * @return a Set of UserDTOs with only the id field
     */
    @Named("idSet")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    public Set<UserDTO> toDtoIdSet(Set<User> users) {
        if (users == null) {
            return Collections.emptySet();
        }

        Set<UserDTO> userSet = new HashSet<>();
        for (User userEntity : users) {
            userSet.add(this.toDtoId(userEntity));
        }

        return userSet;
    }

    /**
     * Converts a User entity to a UserDTO, only including the id and login fields.
     *
     * @param user the User entity to convert
     * @return a UserDTO with only the id and login fields
     */
    @Named("login")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    public UserDTO toDtoLogin(User user) {
        if (user == null) {
            return null;
        }
        UserDTO userDto = new UserDTO();
        //TODO: Adjust this code after Database Entities have been created
        //        userDto.setId(user.getId());
        //        userDto.setLogin(user.getLogin());
        return userDto;
    }

    /**
     * Converts a Set of User entities to a Set of UserDTOs, only including the id and login fields.
     *
     * @param users the Set of User entities to convert
     * @return a Set of UserDTOs with only the id and login fields
     */
    @Named("loginSet")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    public Set<UserDTO> toDtoLoginSet(Set<User> users) {
        if (users == null) {
            return Collections.emptySet();
        }

        Set<UserDTO> userSet = new HashSet<>();
        for (User userEntity : users) {
            userSet.add(this.toDtoLogin(userEntity));
        }

        return userSet;
    }
}

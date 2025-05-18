package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.User;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

/**
 * DTO for {@link User}
 */
@Data
public class UserDTO {

    private UUID userId;
    private String email;
    private String avatar;
    private String firstName;
    private String lastName;
    private String gender;
    private String nationality;
    private LocalDate birthday;
    private String phoneNumber;
    private String website;
    private String linkedinUrl;
    private String selectedLanguage;
    private ResearchGroupShortDTO researchGroup;

    public UserDTO() {
        // default constructor
    }

    public UserDTO(User user) {
        this.userId = user.getUserId();
        this.email = user.getEmail();
        this.avatar = user.getAvatar();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.gender = user.getGender();
        this.nationality = user.getNationality();
        this.birthday = user.getBirthday();
        this.phoneNumber = user.getPhoneNumber();
        this.website = user.getWebsite();
        this.linkedinUrl = user.getLinkedinUrl();
        this.selectedLanguage = user.getSelectedLanguage();
        if (user.getResearchGroup() != null) {
            this.researchGroup = new ResearchGroupShortDTO(user.getResearchGroup());
        }
    }
}

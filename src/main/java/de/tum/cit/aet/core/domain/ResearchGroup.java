package de.tum.cit.aet.core.domain;

import jakarta.persistence.*;
import java.util.List;
import java.util.UUID;

/**
 * A ResearchGroup.
 */
@Entity
@Table(name = "research_groups")
public class ResearchGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "research_group_id", nullable = false)
    private UUID researchGroupId;

    //TODO: Unsure
    @OneToMany(mappedBy = "researchGroup")
    private List<User> users;

    @Column(name = "description")
    private String description;

    @Column(name = "default_field_of_studies")
    private String defaultFieldOfStudies;

    @Column(name = "street")
    private String street;

    @Column(name = "postalCode")
    private String postalCode;

    @Column(name = "city")
    private String city;

    // Getters and Setters

    public UUID getResearchGroupId() {
        return researchGroupId;
    }

    public void setResearchGroupId(UUID researchGroupId) {
        this.researchGroupId = researchGroupId;
    }

    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDefaultFieldOfStudies() {
        return defaultFieldOfStudies;
    }

    public void setDefaultFieldOfStudies(String defaultFieldOfStudies) {
        this.defaultFieldOfStudies = defaultFieldOfStudies;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }
}

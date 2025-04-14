package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.domain.Document;
import jakarta.persistence.*;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * An Applicant.
 */
@Getter
@Setter
@Entity
@Table(name = "applicants")
public class Applicant {

    @Id
    private UUID userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    // Contains all the Applications that a User (Applicant) has submitted
    @OneToMany(mappedBy = "submittedBy", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Application> submittedApplications;

    @Column(name = "street")
    private String street;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "city")
    private String city;

    @Column(name = "cv_filename")
    private String cvFilename;

    @Column(name = "reference_filename")
    private String referenceFilename;

    @Column(name = "bachelor_degree_name")
    private String bachelorDegreeName;

    @Column(name = "bachelor_grade")
    private String bachelorGrade;

    @Column(name = "bachelor_university")
    private String bachelorUniversity;

    @Column(name = "master_degree_name")
    private String masterDegreeName;

    @Column(name = "master_grade")
    private String masterGrade;

    @Column(name = "master_university")
    private String masterUniversity;

    @Column(name = "projects")
    private String projects;

    @Column(name = "special_skills")
    private String specialSkills;

    @Column(name = "interests")
    private String interests;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "applicant")
    private Set<Document> documents;
}

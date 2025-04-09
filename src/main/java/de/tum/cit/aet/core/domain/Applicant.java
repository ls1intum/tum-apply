package de.tum.cit.aet.core.domain;

import jakarta.persistence.*;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "applicants")
public class Applicant {

    @Id
    private UUID userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    //TODO: Uncomment the lines below after the Application Entity has been created
    // -> Adjust "mappedBy" if necessary
    // Contains all the Applications that a User (Applicant) has submitted
    //    @OneToMany(mappedBy = "submittedBy", cascade = CascadeType.ALL, orphanRemoval = true)
    //    private List<Application> submittedApplications;

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

    //TODO: Uncomment the lines below after the Document Entity has been created
    //    @Column(name = "documents")
    //    private List<Document> documents;

    // Getters and Setters

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    //TODO: Uncomment the lines below after the Application Entity has been created
    //    public List<Application> getSubmittedApplications() {
    //        return submittedApplications;
    //    }
    //
    //    public void setSubmittedApplications(List<Application> submittedApplications) {
    //        this.submittedApplications = submittedApplications;
    //    }

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

    public String getCvFilename() {
        return cvFilename;
    }

    public void setCvFilename(String cvFilename) {
        this.cvFilename = cvFilename;
    }

    public String getReferenceFilename() {
        return referenceFilename;
    }

    public void setReferenceFilename(String referenceFilename) {
        this.referenceFilename = referenceFilename;
    }

    public String getBachelorDegreeName() {
        return bachelorDegreeName;
    }

    public void setBachelorDegreeName(String bachelorDegreeName) {
        this.bachelorDegreeName = bachelorDegreeName;
    }

    public String getBachelorGrade() {
        return bachelorGrade;
    }

    public void setBachelorGrade(String bachelorGrade) {
        this.bachelorGrade = bachelorGrade;
    }

    public String getBachelorUniversity() {
        return bachelorUniversity;
    }

    public void setBachelorUniversity(String bachelorUniversity) {
        this.bachelorUniversity = bachelorUniversity;
    }

    public String getMasterDegreeName() {
        return masterDegreeName;
    }

    public void setMasterDegreeName(String masterDegreeName) {
        this.masterDegreeName = masterDegreeName;
    }

    public String getMasterGrade() {
        return masterGrade;
    }

    public void setMasterGrade(String masterGrade) {
        this.masterGrade = masterGrade;
    }

    public String getMasterUniversity() {
        return masterUniversity;
    }

    public void setMasterUniversity(String masterUniversity) {
        this.masterUniversity = masterUniversity;
    }

    public String getProjects() {
        return projects;
    }

    public void setProjects(String projects) {
        this.projects = projects;
    }

    public String getSpecialSkills() {
        return specialSkills;
    }

    public void setSpecialSkills(String specialSkills) {
        this.specialSkills = specialSkills;
    }

    public String getInterests() {
        return interests;
    }

    public void setInterests(String interests) {
        this.interests = interests;
    }
    //TODO: Uncomment the lines below after the Document Entity has been created
    //    public void getDocuments() {
    //        return documents;
    //    }
    //    public void setDocuments(List<Document> documents) {
    //        this.documents = documents;
    //    }
}

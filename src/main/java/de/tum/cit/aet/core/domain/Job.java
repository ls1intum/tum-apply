package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.constants.State;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    private User postedBy;

    // Contains all the Applications that are submitted to this Job
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Application> applications;

    @Column(name = "field_of_studies")
    private String fieldOfStudies;

    @Column(name = "title")
    private String title;

    @Column(name = "introduction")
    private String introduction;

    @Column(name = "about_us")
    private String aboutUs;

    @Column(name = "tasks")
    private String tasks;

    @Column(name = "qualifications")
    private String qualifications;

    @Column(name = "we_offer")
    private String weOffer;

    @Column(name = "application_requirements")
    private String applicationRequirements;

    @Column(name = "data_protection_information")
    private String dataProtectionInformation;

    @Column(name = "contact")
    private String contact;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    private State state;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "application_deadline")
    private Instant applicationDeadline;

    @CreationTimestamp
    @NotNull
    @Column(name = "created_at", nullable = false)
    private String createdAt;

    @UpdateTimestamp
    @Column(name = "last_updated")
    private String lastUpdated;

    public UUID getJobId() {
        return jobId;
    }

    public void setJobId(UUID jobId) {
        this.jobId = jobId;
    }

    public User getPostedBy() {
        return postedBy;
    }

    public void setPostedBy(User postedBy) {
        this.postedBy = postedBy;
    }

    public List<Application> getApplications() {
        return applications;
    }

    public void setApplications(List<Application> applications) {
        this.applications = applications;
    }

    public String getFieldOfStudies() {
        return fieldOfStudies;
    }

    public void setFieldOfStudies(String fieldOfStudies) {
        this.fieldOfStudies = fieldOfStudies;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getIntroduction() {
        return introduction;
    }

    public void setIntroduction(String introduction) {
        this.introduction = introduction;
    }

    public String getAboutUs() {
        return aboutUs;
    }

    public void setAboutUs(String aboutUs) {
        this.aboutUs = aboutUs;
    }

    public String getTasks() {
        return tasks;
    }

    public void setTasks(String tasks) {
        this.tasks = tasks;
    }

    public String getQualifications() {
        return qualifications;
    }

    public void setQualifications(String qualifications) {
        this.qualifications = qualifications;
    }

    public String getWeOffer() {
        return weOffer;
    }

    public void setWeOffer(String weOffer) {
        this.weOffer = weOffer;
    }

    public String getApplicationRequirements() {
        return applicationRequirements;
    }

    public void setApplicationRequirements(String applicationRequirements) {
        this.applicationRequirements = applicationRequirements;
    }

    public String getDataProtectionInformation() {
        return dataProtectionInformation;
    }

    public void setDataProtectionInformation(String dataProtectionInformation) {
        this.dataProtectionInformation = dataProtectionInformation;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public void setStartDate(Instant startDate) {
        this.startDate = startDate;
    }

    public Instant getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(Instant applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}

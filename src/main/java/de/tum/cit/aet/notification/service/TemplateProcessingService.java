package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.constants.TemplateVariable;
import de.tum.cit.aet.notification.domain.EmailTemplateTranslation;
import de.tum.cit.aet.notification.dto.DataExportEmailContext;
import de.tum.cit.aet.notification.dto.ResearchGroupEmailContext;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TemplateProcessingService {

    private final Configuration freemarkerConfig;
    private static final String BASE_RAW_TEMPLATE = "base/raw.ftl";

    @Value("${aet.client.url}")
    private String url;

    public TemplateProcessingService(Configuration freemarkerConfig) {
        this.freemarkerConfig = freemarkerConfig;
    }

    /**
     * Renders the email subject line for display in the final email using the provided content for variable binding.
     *
     * @param emailTemplateTranslation the email template translation
     * @param content                  the domain object for variable binding
     * @return the prefixed subject line
     */
    public String renderSubject(EmailTemplateTranslation emailTemplateTranslation, Object content) {
        return renderSubject(emailTemplateTranslation.getSubject(), content);
    }

    /**
     * Renders a raw subject string using FreeMarker variables.
     *
     * @param rawSubject the raw subject string
     * @param content    the domain object for variable binding
     * @return the rendered and prefixed subject line
     */
    public String renderSubject(String rawSubject, Object content) {
        try {
            Map<String, Object> dataModel = content == null ? new HashMap<>() : createDataModel(content);
            // Render subject through Freemarker string template
            Template subjectTemplate = new Template("subject", new StringReader(rawSubject), freemarkerConfig);
            String renderedSubject = render(subjectTemplate, dataModel);
            return "TUMApply - " + renderedSubject;
        } catch (IOException ex) {
            throw new TemplateProcessingException("Failed to render subject template", ex);
        }
    }

    /**
     * Renders the HTML email body using FreeMarker and applies layout formatting.
     *
     * @param emailTemplateTranslation the template translation containing raw HTML
     *                                 and language
     * @param content                  the domain object (e.g. Application, Job) for
     *                                 variable binding
     * @return the fully rendered HTML email body
     * @throws TemplateProcessingException if template parsing or rendering fails
     */
    public String renderTemplate(@NonNull EmailTemplateTranslation emailTemplateTranslation, @NonNull Object content) {
        try {
            Map<String, Object> dataModel = createDataModel(content);
            addMetaData(emailTemplateTranslation.getLanguage(), dataModel);

            String templateName =
                emailTemplateTranslation.getEmailTemplate().getTemplateName() != null
                    ? emailTemplateTranslation.getEmailTemplate().getTemplateName()
                    : "inline";

            Template inlineTemplate = new Template(
                templateName,
                new StringReader(emailTemplateTranslation.getBodyHtml()),
                freemarkerConfig
            );

            String htmlBody = render(inlineTemplate, dataModel);
            return renderLayout(emailTemplateTranslation.getLanguage(), htmlBody, false);
        } catch (IOException ex) {
            throw new TemplateProcessingException(
                "Failed to process inline FreeMarker template: " +
                    emailTemplateTranslation.getEmailTemplate().getTemplateName() +
                    " for language: " +
                    emailTemplateTranslation.getLanguage(),
                ex
            );
        }
    }

    /**
     * Wraps raw HTML content in the base layout template.
     *
     * @param language the language for metadata injection
     * @param html     the raw HTML to wrap
     * @return the wrapped and optionally sanitized HTML
     */
    public String renderRawTemplate(@NonNull Language language, String html) {
        return renderLayout(language, html, true);
    }

    /**
     * Renders HTML inside the base layout template, with optional sanitization.
     *
     * @param language the email language
     * @param html     the raw body HTML
     * @param sanitize whether to sanitize the HTML
     * @return fully rendered HTML including layout
     * @throws TemplateProcessingException if layout template rendering fails
     */
    private String renderLayout(Language language, String html, boolean sanitize) {
        try {
            Template layout = freemarkerConfig.getTemplate(BASE_RAW_TEMPLATE);

            Map<String, Object> model = new HashMap<>();
            model.put("bodyHtml", sanitize ? HtmlSanitizer.sanitize(html) : html);
            addMetaData(language, model);

            return render(layout, model);
        } catch (IOException ex) {
            throw new TemplateProcessingException("Failed to load raw FreeMarker template", ex);
        }
    }

    /**
     * Processes a FreeMarker template using the given data model.
     *
     * @param template  the FreeMarker template
     * @param dataModel the data model used for rendering
     * @return the rendered HTML as a string
     * @throws TemplateProcessingException if rendering fails
     */
    private String render(Template template, Map<String, Object> dataModel) {
        try (StringWriter writer = new StringWriter()) {
            template.process(dataModel, writer);
            return writer.toString();
        } catch (IOException | TemplateException ex) {
            throw new TemplateProcessingException("Failed to render FreeMarker template '" + template.getName() + "'", ex);
        }
    }

    /**
     * Builds the data model used in templates from the provided domain object.
     *
     * @param content the object to extract data from (Application, Job, or
     *                ResearchGroup)
     * @return a data model for template binding
     * @throws TemplateProcessingException if the content type is unsupported
     */
    private Map<String, Object> createDataModel(Object content) {
        Map<String, Object> dataModel = new HashMap<>();
        switch (content) {
            case Application application -> addApplicationData(dataModel, application);
            case Job job -> addJobData(dataModel, job);
            case ResearchGroup researchGroup -> addResearchGroupData(dataModel, researchGroup);
            case InterviewSlot slot -> addInterviewSlotData(dataModel, slot);
            case ResearchGroupEmailContext ctx -> addResearchGroupContextData(dataModel, ctx);
            case Interviewee interviewee -> addIntervieweeData(dataModel, interviewee);
            case DataExportEmailContext ctx -> addDataExportContextData(dataModel, ctx);
            default -> {
                throw new TemplateProcessingException("Unsupported content type: " + content.getClass().getName());
            }
        }
        return dataModel;
    }

    /**
     * Adds application-related variables to the template data model.
     *
     * @param dataModel   the data model map
     * @param application the application object
     */
    private void addApplicationData(Map<String, Object> dataModel, Application application) {
        User applicant = application.getApplicant().getUser();
        dataModel.put(TemplateVariable.APPLICANT_FIRST_NAME.getValue(), applicant.getFirstName());
        dataModel.put(TemplateVariable.APPLICANT_LAST_NAME.getValue(), applicant.getLastName());

        addJobData(dataModel, application.getJob());
    }

    /**
     * Adds job-related variables to the template data model.
     *
     * @param dataModel the data model map
     * @param job       the job object
     */
    private void addJobData(Map<String, Object> dataModel, Job job) {
        dataModel.put(TemplateVariable.JOB_TITLE.getValue(), job.getTitle());

        User supervisingProfessor = job.getSupervisingProfessor();
        dataModel.put(TemplateVariable.SUPERVISING_PROFESSOR_FIRST_NAME.getValue(), supervisingProfessor.getFirstName());
        dataModel.put(TemplateVariable.SUPERVISING_PROFESSOR_LAST_NAME.getValue(), supervisingProfessor.getLastName());
        dataModel.put(TemplateVariable.SUPERVISING_PROFESSOR_EMAIL.getValue(), supervisingProfessor.getEmail());

        addResearchGroupData(dataModel, job.getResearchGroup());
    }

    private static final java.time.ZoneId CET_TIMEZONE = java.time.ZoneId.of("Europe/Berlin");
    private static final java.time.format.DateTimeFormatter DATE_FORMATTER = java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final java.time.format.DateTimeFormatter TIME_FORMATTER = java.time.format.DateTimeFormatter.ofPattern("HH:mm");

    private void addInterviewSlotData(Map<String, Object> dataModel, InterviewSlot slot) {
        java.time.ZonedDateTime startTime = slot.getStartDateTime().atZone(CET_TIMEZONE);
        java.time.ZonedDateTime endTime = slot.getEndDateTime().atZone(CET_TIMEZONE);

        dataModel.put(TemplateVariable.INTERVIEW_DATE.getValue(), startTime.format(DATE_FORMATTER));
        dataModel.put(TemplateVariable.INTERVIEW_START_TIME.getValue(), startTime.format(TIME_FORMATTER));
        dataModel.put(TemplateVariable.INTERVIEW_END_TIME.getValue(), endTime.format(TIME_FORMATTER));
        dataModel.put(TemplateVariable.INTERVIEW_LOCATION.getValue(), slot.getLocation());
        dataModel.put(TemplateVariable.INTERVIEW_STREAM_LINK.getValue(), slot.getStreamLink());

        // Add applicant data from interviewee
        if (slot.getInterviewee() != null && slot.getInterviewee().getApplication() != null) {
            Application application = slot.getInterviewee().getApplication();
            User applicant = application.getApplicant().getUser();
            dataModel.put(TemplateVariable.APPLICANT_FIRST_NAME.getValue(), applicant.getFirstName());
            dataModel.put(TemplateVariable.APPLICANT_LAST_NAME.getValue(), applicant.getLastName());
            dataModel.put(TemplateVariable.APPLICANT_GENDER.getValue(), application.getApplicantGender());
        }

        addJobData(dataModel, slot.getInterviewProcess().getJob());
    }

    /**
     * Adds combined user and research group data for research-group-related emails.
     */
    private void addResearchGroupContextData(Map<String, Object> dataModel, ResearchGroupEmailContext context) {
        addUserData(dataModel, context.user());
        addResearchGroupData(dataModel, context.researchGroup());
    }

    /**
     * Adds interviewee-related variables to the template data model.
     * Including the self-scheduling booking link.
     *
     * @param dataModel   the data model map
     * @param interviewee the interviewee object
     */
    private void addIntervieweeData(Map<String, Object> dataModel, Interviewee interviewee) {
        // Reuse application data (name, etc.)
        addApplicationData(dataModel, interviewee.getApplication());

        // Add booking link: {clientUrl}/interview-booking/{processId}
        String bookingLink = url + "/interview-booking/" + interviewee.getInterviewProcess().getId();
        dataModel.put(TemplateVariable.BOOKING_LINK.getValue(), bookingLink);
    }

    /**
     * Adds research group-related variables to the template data model.
     *
     * @param dataModel     the data model map
     * @param researchGroup the research group object
     */
    private void addResearchGroupData(Map<String, Object> dataModel, ResearchGroup researchGroup) {
        dataModel.put(TemplateVariable.RESEARCH_GROUP_NAME.getValue(), researchGroup.getName());
    }

    private void addDataExportContextData(Map<String, Object> dataModel, DataExportEmailContext ctx) {
        addUserData(dataModel, ctx.user());
        dataModel.put(TemplateVariable.DOWNLOAD_LINK.getValue(), ctx.downloadLink());
        dataModel.put(TemplateVariable.EXPORT_EXPIRES_DAYS.getValue(), ctx.expiresDays());
    }

    /**
     * Adds generic user data to the template data model.
     *
     * @param dataModel the data model map
     * @param user      the user object
     */
    private void addUserData(Map<String, Object> dataModel, User user) {
        dataModel.put(TemplateVariable.USER_FIRST_NAME.getValue(), user.getFirstName());
        dataModel.put(TemplateVariable.USER_LAST_NAME.getValue(), user.getLastName());
    }

    /**
     * Adds language metadata and application URL to the data model.
     *
     * @param language  the language used for rendering
     * @param dataModel the data model map
     */
    private void addMetaData(Language language, Map<String, Object> dataModel) {
        dataModel.put("language", language.getCode());
        dataModel.put("url", url);
    }
}

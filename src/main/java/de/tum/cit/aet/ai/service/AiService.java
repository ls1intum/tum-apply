package de.tum.cit.aet.ai.service;

import static de.tum.cit.aet.core.constants.GenderBiasWordLists.*;

import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.dto.ExtractedApplicationDataDTO;
import de.tum.cit.aet.ai.dto.ExtractedCertificateDataDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.exception.PDFExtractionException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

@Service
@Slf4j
public class AiService {

    @Value("classpath:prompts/JobDescriptionGeneration.st")
    private Resource jobGenerationResource;

    @Value("classpath:prompts/TranslateText.st")
    private Resource translationResource;

    @Value("classpath:prompts/ExtractCvData.st")
    private Resource cVExtractionResource;

    @Value("classpath:prompts/ExtractCertificateData.st")
    private Resource certificateExtractionResource;

    private final ChatClient chatClient;

    private final JobService jobService;

    private final ApplicationService applicationService;

    private final DocumentDictionaryService documentDictionaryService;

    private final CurrentUserService currentUserService;

    public AiService(
        ChatClient.Builder chatClientBuilder,
        JobService jobService,
        ApplicationService applicationService,
        DocumentDictionaryService documentDictionaryService,
        CurrentUserService currentUserService
    ) {
        this.chatClient = chatClientBuilder.build();
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.documentDictionaryService = documentDictionaryService;
        this.currentUserService = currentUserService;
    }

    /**
     * Generates a job application draft using streaming for faster perceived response time.
     * Returns a Flux that emits content chunks as they are generated.
     * After streaming completes, automatically translates the content to the other language.
     *
     * @param jobFormDTO          the job form data containing description, requirements, and tasks
     * @param descriptionLanguage the language for the generated job description ("de" or "en")
     * @return Flux of content chunks as they are generated
     */
    public Flux<String> generateJobApplicationDraftStream(JobFormDTO jobFormDTO, String descriptionLanguage) {
        String input = "de".equals(descriptionLanguage) ? jobFormDTO.jobDescriptionDE() : jobFormDTO.jobDescriptionEN();

        Set<String> inclusive = "de".equals(descriptionLanguage) ? GERMAN_INCLUSIVE : ENGLISH_INCLUSIVE;
        Set<String> nonInclusive = "de".equals(descriptionLanguage) ? GERMAN_NON_INCLUSIVE : ENGLISH_NON_INCLUSIVE;
        final String locationText = jobFormDTO.location() != null ? jobFormDTO.location().correctLanguageValue(descriptionLanguage) : "";

        return chatClient
            .prompt()
            .user(u ->
                u
                    .text(jobGenerationResource)
                    .param("descriptionLanguage", descriptionLanguage)
                    .param("jobDescription", input)
                    .param("title", jobFormDTO.title() != null ? jobFormDTO.title() : "")
                    .param("researchArea", jobFormDTO.researchArea() != null ? jobFormDTO.researchArea() : "")
                    .param(
                        "subjectArea",
                        jobFormDTO.subjectArea() != null ? jobFormDTO.subjectArea().correctLanguageValue(descriptionLanguage) : ""
                    )
                    .param("location", locationText)
                    .param("inclusiveWords", String.join(", ", inclusive))
                    .param("nonInclusiveWords", String.join(", ", nonInclusive))
            )
            .stream()
            .content()
            .delayElements(Duration.ofMillis(35));
    }

    /**
     * Translates the provided text between German and English.
     * The translation preserves the original text structure and formatting.
     *
     * @param text the text to translate (German or English)
     * @return The translated text response with detected and target language info
     */
    private AIJobDescriptionTranslationDTO translateText(String text, String toLang) {
        Set<String> inclusive = "de".equals(toLang) ? GERMAN_INCLUSIVE : ENGLISH_INCLUSIVE;
        Set<String> nonInclusive = "de".equals(toLang) ? GERMAN_NON_INCLUSIVE : ENGLISH_NON_INCLUSIVE;

        return chatClient
            .prompt()
            .user(u ->
                u
                    .text(translationResource)
                    .param("text", text)
                    .param("targetLanguage", toLang)
                    .param("inclusiveWords", String.join(", ", inclusive))
                    .param("nonInclusiveWords", String.join(", ", nonInclusive))
            )
            .call()
            .entity(AIJobDescriptionTranslationDTO.class);
    }

    /**
     * Translates the provided job description text and persists the translated version
     * in the job entity for the specified language.
     *
     * @param jobId  the ID of the job to update
     * @param toLang the target language for translation ("de" or "en")
     * @param text   the job description text to translate
     * @return The translated text response with detected and target language info
     */
    public AIJobDescriptionTranslationDTO translateAndPersistJobDescription(String jobId, String toLang, String text) {
        currentUserService.markAiConsentForCurrentUser();
        AIJobDescriptionTranslationDTO translated = translateText(text, toLang);
        String translatedText = translated.translatedText();
        if (translatedText != null && !translatedText.isBlank()) {
            jobService.updateJobDescriptionLanguage(jobId, toLang, translatedText);
        }
        return translated;
    }

    /**
     * Extracts applicant data from the provided PDF files by converting them to images
     * first, since the Azure OpenAI endpoint only accepts image inputs.
     * 1) Load the PDFs and render each page as a PNG image
     * 2) Send the images to the LLM with the extraction prompt
     *
     * @param pdfFiles the PDF file resources to be analyzed
     * @return the extracted data as a structured DTO
     */
    private ExtractedApplicationDataDTO extractPdfData(List<Resource> pdfFiles, boolean isCv) {
        List<ByteArrayResource> pageImages = new ArrayList<>();

        Resource prompt = isCv ? cVExtractionResource : certificateExtractionResource;
        Class<?> targetClass = isCv ? ExtractedApplicationDataDTO.class : ExtractedCertificateDataDTO.class;

        try {
            for (Resource pdfFile : pdfFiles) {
                try (PDDocument document = Loader.loadPDF(pdfFile.getContentAsByteArray())) {
                    // 1) Render each PDF page as a PNG image
                    PDFRenderer pdfRenderer = new PDFRenderer(document);
                    int pageCount = document.getNumberOfPages();

                    for (int i = 0; i < pageCount; i++) {
                        BufferedImage image = pdfRenderer.renderImageWithDPI(i, 300);
                        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                        ImageIO.write(image, "png", byteArrayOutputStream);
                        pageImages.add(new ByteArrayResource(byteArrayOutputStream.toByteArray()));
                    }
                }
            }

            // 2) Send the images to the LLM with the extraction prompt
            Object result = chatClient
                .prompt()
                .user(u -> {
                    u.text(prompt);
                    for (ByteArrayResource pageImage : pageImages) {
                        u.media(MediaType.IMAGE_PNG, pageImage);
                    }
                })
                .call()
                .entity(targetClass);

            if (isCv) {
                return (ExtractedApplicationDataDTO) result;
            } else {
                return ExtractedApplicationDataDTO.onlyEducationDTO((ExtractedCertificateDataDTO) result);
            }
        } catch (IOException e) {
            throw new PDFExtractionException("PDF conversion failed", e);
        }
    }

    /**
     * Extracts applicant data from PDF documents and persists the extracted data
     * in the application entity.
     * 1) Download the documents
     * 2) Extract data from the PDFs via AI
     * 3) Persist the extracted data into the application if saveData is true
     *
     * @param applicationId the ID of the application to update with extracted data
     * @param docIds         the IDs of the documents to extract data from
     * @param isCv           whether the document is a CV (true) or a certificate (false), which will affect the extraction prompt
     * @param saveData      whether to persist the extracted data into the application entity
     * @return the extracted data as a structured DTO
     */
    public ExtractedApplicationDataDTO extractAndPersistPdfData(String applicationId, List<String> docIds, boolean isCv, boolean saveData) {
        currentUserService.markAiConsentForCurrentUser();
        // 1) Download the document
        List<Resource> docs = new ArrayList<>();
        for (String docId : docIds) {
            docs.add(documentDictionaryService.downloadDocument(UUID.fromString(docId)));
        }
        // 2) Extract data from the PDFs via AI
        ExtractedApplicationDataDTO extracted = extractPdfData(docs, isCv);
        // 3) Persist the extracted data into the application
        if (extracted != null && saveData) {
            applicationService.applyExtractedCvData(applicationId, extracted);
        }
        return extracted;
    }

    /**
     * Extracts applicant data from uploaded PDF files (multipart) without requiring
     * persisted document IDs. Files are processed in-memory only.
     *
     * @param applicationId the ID of the application to update (only used if saveData is true)
     * @param files         the uploaded PDF files
     * @param isCv          whether the documents are CVs or certificates
     * @param saveData      whether to persist the extracted data into the application
     * @return the extracted data as a structured DTO
     */
    public ExtractedApplicationDataDTO extractPdfDataFromFiles(
        String applicationId,
        List<MultipartFile> files,
        boolean isCv,
        boolean saveData
    ) {
        currentUserService.markAiConsentForCurrentUser();
        // 1) Convert multipart files to Resource objects
        List<Resource> docs = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                docs.add(new ByteArrayResource(file.getBytes()));
            } catch (IOException e) {
                throw new PDFExtractionException("Failed to read uploaded file", e);
            }
        }
        // 2) Extract data from the PDFs via AI
        ExtractedApplicationDataDTO extracted = extractPdfData(docs, isCv);
        // 3) Persist the extracted data into the application if requested
        if (extracted != null && saveData && applicationId != null && !applicationId.isBlank()) {
            applicationService.applyExtractedCvData(applicationId, extracted);
        }
        return extracted;
    }
}

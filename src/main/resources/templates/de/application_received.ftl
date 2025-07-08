<#import "../base/layout.ftl" as layout>

<@layout.emailLayout language=language>
    <p>Sehr geehrter Herr Professor / Sehr geehrte Frau Professorin ${professorLastName!},</p>

    <p>für die Position <strong>${jobTitle!}</strong> in Ihrer Forschungsgruppe wurde eine neue Bewerbung eingereicht.</p>

    <p>Die Bewerbung stammt von <strong>${applicantFirstName!} ${applicantLastName!}</strong>.</p>

    <p>Sie können die Bewerbung über den folgenden Button einsehen:</p>

    <p style="margin: 20px 0;">
        <a href="${url!}/evaluation/application?sortBy=createdAt&sortDir=DESC&applicationId=${applicationId!}"
           style="display: inline-block; padding: 10px 18px; background-color: #0056b3; color: #ffffff; text-decoration: none; border-radius: 5px;">
            Bewerbung anzeigen
        </a>
    </p>

    <p>Mit freundlichen Grüßen<br/>Ihr TUMApply Team</p>
</@layout.emailLayout>

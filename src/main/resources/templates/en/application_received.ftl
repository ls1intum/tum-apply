<#import "../base/layout.ftl" as layout>

<@layout.emailLayout language=language>
    <p>Dear Professor ${professorLastName!},</p>

    <p>A new application has been submitted for the position <strong>${jobTitle!}</strong> in your research group.</p>

    <p>The applicant is <strong>${applicantFirstName!} ${applicantLastName!}</strong>.</p>

    <p>You can review the application by clicking the button below:</p>

    <p style="margin: 20px 0;">
        <a href="${url!}/evaluation/application?sortBy=createdAt&sortDir=DESC&applicationId=${applicationId!}"
           style="display: inline-block; padding: 10px 18px; background-color: #1872DD; color: #ffffff; text-decoration: none; border-radius: 5px;">
            View Application
        </a>
    </p>

    <p>Best regards,<br/>Your TUMApply Team</p>
</@layout.emailLayout>



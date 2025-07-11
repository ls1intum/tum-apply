<#import "../base/layout.ftl" as layout>

<@layout.emailLayout language=language>

  <p>Dear ${applicantFirstName!} ${applicantLastName!},</p>

  <p>Thank you for your interest in the position <strong>${jobTitle!}</strong> at our research group <strong>${researchGroupName!}</strong>.</p>

  <p>We confirm that your application has been successfully withdrawn and will no longer be considered in the selection process.</p>

  <p>Your application details will not be shown to reviewers, and no further action is required from your side.</p>

  <p>We wish you all the best for your future endeavors.</p>

  <p>Best regards,<br/>The ${researchGroupName!} Team</p>

</@layout.emailLayout>

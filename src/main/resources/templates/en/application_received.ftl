<#import "../base/layout.ftl" as layout>

<@layout.emailLayout>

  <p>Dear ${applicantFirstName!},</p>

  <p>Thank you for your application for the position <strong>${jobTitle!}</strong> at our research group <strong>${researchGroupName!}</strong>.</p>

  <p>We confirm that your application has been received and will now be reviewed carefully. Please note that this process may take a few days.</p>

  <p>We will notify you as soon as the status of your application changes.</p>

  <p>Best regards,<br/>The ${researchGroupName!} Team</p>

</@layout.emailLayout>

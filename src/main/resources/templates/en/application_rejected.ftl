<#import "../base/layout.ftl" as layout>

<@layout.emailLayout language=language>
  <p>Dear ${applicantFirstName!} ${applicantLastName!},</p>

  <p>Thank you for your application for the position <strong>${jobTitle!}</strong> at our research group <strong>${researchGroupName!}</strong>. We truly appreciate the time and effort you invested in preparing your materials and expressing your interest.</p>

<#-- Dynamic rejection reason based on enum -->
  <#if reason == "JOB_FILLED">
    <p>We regret to inform you that the position has already been filled. As a result, we will not be proceeding with any current applications, including yours.</p>
  <#elseif reason == "JOB_OUTDATED">
    <p>We regret to inform you that the position has been closed due to changes in our internal hiring plans. Therefore, all applications for this position, including yours, will not be considered further.</p>
  <#elseif reason == "FAILED_REQUIREMENTS">
    <p>After careful review, we found that your profile does not fully meet the specific requirements of this position. As such, we will not be moving forward with your application.</p>
  <#elseif reason == "OTHER_REASON">
    <p>Unfortunately, we are unable to proceed with your application for reasons unrelated to your qualifications. The position will not be filled as initially planned.</p>
  <#else>
    <p>We regret to inform you that we will not be moving forward with your application.</p>
  </#if>

  <p>We understand that applying to doctoral positions requires significant preparation, and we sincerely value your interest in joining our research group. We encourage you to explore future opportunities within our research group.</p>

  <p>Wishing you all the best in your academic and professional journey.</p>

  <p>Best regards,<br/>The ${researchGroupName!} Team</p>
</@layout.emailLayout>

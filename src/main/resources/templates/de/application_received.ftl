<#import "../base/layout.ftl" as layout>

<@layout.emailLayout>

  <p>Sehr geehrte*r ${applicantFirstName!},</p>

  <p>vielen Dank für Ihre Bewerbung auf die Position <strong>${jobTitle!}</strong> in unserer Forschungsgruppe <strong>${researchGroupName!}</strong>.</p>

  <p>Wir bestätigen den Erhalt Ihrer Unterlagen. Ihre Bewerbung wird nun sorgfältig geprüft. Bitte beachten Sie, dass dies einige Tage in Anspruch nehmen kann.</p>

  <p>Sobald sich der Status Ihrer Bewerbung ändert, werden wir Sie umgehend informieren.</p>

  <p>Mit freundlichen Grüßen,<br/>Ihr ${researchGroupName!} Team</p>

</@layout.emailLayout>

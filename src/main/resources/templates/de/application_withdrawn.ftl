<#import "../base/layout.ftl" as layout>

<@layout.emailLayout language=language>

  <p>Sehr geehrte*r ${applicantFirstName!} ${applicantLastName!},</p>

  <p>vielen Dank für Ihr Interesse an der Position <strong>${jobTitle!}</strong> in unserer Forschungsgruppe <strong>${researchGroupName!}</strong>.</p>

  <p>Hiermit bestätigen wir, dass Ihre Bewerbung erfolgreich zurückgezogen wurde und nicht mehr im Auswahlverfahren berücksichtigt wird.</p>

  <p>Ihre Bewerbungsdaten werden den Gutachter*innen nicht mehr angezeigt, und es sind keine weiteren Schritte Ihrerseits erforderlich.</p>

  <p>Wir wünschen Ihnen weiterhin viel Erfolg auf Ihrem beruflichen Weg.</p>

  <p>Mit freundlichen Grüßen<br/>Ihr ${researchGroupName!} Team</p>

</@layout.emailLayout>

<#import "../base/layout.ftl" as layout>

<@layout.emailLayout language=language>
  <p>Sehr geehrte*r ${applicantFirstName!} ${applicantLastName!},</p>

  <p>vielen Dank für Ihre Bewerbung auf die Position <strong>${jobTitle!}</strong> in unserer Forschungsgruppe <strong>${researchGroupName!}</strong>. Wir schätzen das Engagement und die Zeit, die Sie in Ihre Unterlagen und Ihr Interesse investiert haben, sehr.</p>

<#-- Dynamic rejection reason based on enum -->
  <#if reason == "JOB_FILLED">
    <p>Wir müssen Ihnen mitteilen, dass die Position bereits vergeben wurde. Daher können wir Ihre Bewerbung leider nicht weiter berücksichtigen.</p>
  <#elseif reason == "JOB_OUTDATED">
    <p>Die Position wurde aufgrund interner Änderungen in der Personalplanung geschlossen. Aus diesem Grund können wir keine der eingegangenen Bewerbungen, einschließlich Ihrer, weiter berücksichtigen.</p>
  <#elseif reason == "FAILED_REQUIREMENTS">
    <p>Nach sorgfältiger Prüfung mussten wir feststellen, dass Ihr Profil die spezifischen Anforderungen dieser Position nicht vollständig erfüllt. Daher sehen wir von einer weiteren Berücksichtigung Ihrer Bewerbung ab.</p>
  <#elseif reason == "OTHER_REASON">
    <p>Leider können wir Ihre Bewerbung aus Gründen, die nicht mit Ihrer Qualifikation zusammenhängen, nicht weiterverfolgen. Die Position wird nicht wie ursprünglich geplant besetzt.</p>
  <#else>
    <p>Leider können wir Ihre Bewerbung nicht weiter berücksichtigen.</p>
  </#if>

  <p>Wir wissen, dass eine Bewerbung für ein Promotionsprogramm eine gründliche Vorbereitung erfordert, und danken Ihnen herzlich für Ihr Interesse an unserer Forschungsgruppe. Gerne laden wir Sie ein, sich in Zukunft erneut auf passende Stellen in unserer Forschungsgruppe zu bewerben.</p>

  <p>Für Ihren weiteren akademischen und beruflichen Weg wünschen wir Ihnen viel Erfolg.</p>

  <p>Mit freundlichen Grüßen<br/>Ihr ${researchGroupName!} Team</p>
</@layout.emailLayout>

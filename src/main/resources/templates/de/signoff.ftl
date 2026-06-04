<#-- TUMApply system sign-off (informal "Du") -->
<#macro system>
    <p>Mit freundlichen Grüßen<br />Dein TUMApply Team</p>
</#macro>

<#-- Research group sign-off, uses the RESEARCH_GROUP_NAME template variable -->
<#macro researchGroup>
    <p>Mit freundlichen Grüßen<br />Dein ${RESEARCH_GROUP_NAME!} Team</p>
</#macro>

<#-- TUMApply system sign-off (formal "Sie") for external recipients -->
<#macro systemFormal>
    <p>Mit freundlichen Grüßen<br />Ihr TUMApply Team</p>
</#macro>

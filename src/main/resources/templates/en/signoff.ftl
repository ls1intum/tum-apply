<#-- TUMApply system sign-off -->
<#macro system>
    <p>Best regards,<br />Your TUMApply Team</p>
</#macro>

<#-- Research group sign-off, uses the RESEARCH_GROUP_NAME template variable -->
<#macro researchGroup>
    <p>Best regards,<br />Your ${RESEARCH_GROUP_NAME!} Team</p>
</#macro>

<#-- TUMApply system sign-off, used for emails to external recipients -->
<#macro systemFormal>
    <p>Best regards,<br />Your TUMApply Team</p>
</#macro>

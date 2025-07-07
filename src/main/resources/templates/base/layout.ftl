<#ftl output_format="HTML">

<#-- Base Layout containing the styles -->
<#macro emailLayout bodyHtml="" language="en">
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px;">
    <div style="line-height: 1.6;">
      <#if bodyHtml?has_content>
        ${bodyHtml?no_esc}
      <#else>
        <#nested />
      </#if>
    </div>
    <div style="font-size: 12px; color: #777777; text-align: center; padding-top: 20px;">
      <#if language == "de">
        <#include "../de/footer.ftl">
      <#else>
        <#include "../en/footer.ftl">
      </#if>
    </div>
  </div>
  </body>
  </html>
</#macro>

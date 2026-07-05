<#import "../base/layout.ftl" as layout>

<#-- Used for inserting raw HTML into the layout -->
<@layout.emailLayout bodyHtml=bodyHtml language=(language!"en") signoff=(SIGNOFF_TYPE!"none") />

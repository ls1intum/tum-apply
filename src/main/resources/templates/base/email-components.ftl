<#ftl output_format="HTML">

<#macro ctaButton href label>
  <p style="margin: 1.25rem 0">
    <a
      href="${href}"
      style="display: inline-block; padding: 0.5rem 1rem; font-size: 1rem; background-color: #3070b3; color: #ffffff; text-decoration: none; border-radius: 0.375rem; font-weight: 600"
    >
      ${label}
    </a>
  </p>
</#macro>

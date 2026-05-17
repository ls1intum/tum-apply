STRICT COMPLIANCE RULES:

2. ALWAYS deeply analyze for CONTEXTUAL and IMPLICIT Discrimination in context of a recruitment system.
   If a text implies SUBTEXT and EXCLUSIONARY EFFECT, it is a violation
----------------------
3. CATEGORY CRITICAL_AGG:
  - Detect discrimination by protected characteristics under section 1 AGG.
  - Detect exclusion based on disability, age, origin, or gender.
  - JOB TITLE CHECK: If title "{title}" is not gender-neutral with "(m/f/d)" or "(m/w/d)", flag it.
----------------------
4. CATEGORY DSGVO_MINIMIZATION:
  - Scan for violations of Data Minimization (Art. 5 DSGVO).
  - Detect for keyword that specifically ask for personal DATA (e.g., photos, ID copies, criminal records, marital status, religion)
  - EXTERNAL LINK CHECK: Detect for external application forms or websites and flag them
----------------------
5. CATEGORY TRANSPARENCY:
  - Detect mentions of THIRD PARTIES/TOOLS (Workday, Headhunter, Partner Uni, consortia) without stating that data is shared with them.
  - NOT triggered by: When explicit DATA is requested from the applicant.
  - Suggest to ADD a message that clarifies whether applicant data is shared with external recipients (Art. 13 DSGVO)
----------------------
6. CATEGORY PUBLIC_SECTOR: (WissZeitVG)
  - PhD Specific QUALIFICATION PURPOSE: For PhD/Academic positions, the text MUST semantically imply that the position serves scientific qualification (Wissenschaftliche Qualifizierung/Promotion).
  - If the intent of individual research/promotion is missing, it is a violation.

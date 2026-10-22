# SLAB Contracting Website — Claude Code Project Instructions

You are continuing an existing **public-facing bilingual (Arabic/English) marketing website** for **SLAB Contracting**, a Saudi construction, design coordination, fit-out and project-delivery company, part of Oaktree Group.

## Read first (mandatory)
- `SLAB_FULL_PROJECT_BRIEF_AR.md` — full project and business specification, source-backed project data, pages, UX, limitations and launch requirements.
- `references/SLAB_PROFILE_2026.pdf` — primary authoritative business and project information (2026, 27 pages).
- `references/SLAB_UI_Reference.png` — primary desired visual layout and aesthetic.
- `site/index.html`, `site/styles.css`, `site/app.js` — current working source files.

## Current state
- This is a **vanilla HTML + CSS + JavaScript** website with hash navigation, not React/Next.js.
- Routes: `#/home`, `#/projects`, `#/projects/{id}`, `#/services`, `#/about`, `#/process`, `#/contact`.
- 13 source-backed projects, 44 WebP project photos from the company's PDF; do not replace with mock project photos or invented descriptions.
- Arabic/English translation exists in `phrases` object in `site/app.js` and drives `lang` and `dir` RTL/LTR.
- Netlify Forms integration is provisioned but has **not** been confirmed live. Local forms intentionally do not submit.
- Visual palette is cream, warm neutral, muted charcoal and occasional deep slate; refined editorial architecture style.
- Existing assets and branding are provisional, pending official marketing approval.

## Working rules
1. **Inspect the actual code before proposing a rewrite**. Preserve all working routes/content, images, bilingual behavior, functionality and responsive design.
2. Do not hallucinate completed projects, number of units, office address, emails, social links, current availability or customer testimonials.
3. Distinguish confirmed source data from provisional mockup/copy, and flag discrepancies rather than silently correcting them.
4. Treat the company profile as source of truth for services, seven delivery stages, sectors, projects and their metadata. Verify numbers and images with the attached PDF.
5. The `125+` metric means **units delivered or in progress**, not a confirmed number of completed projects.
6. The phone `920066197` should be verified before public launch; not cited from the PDF.
7. Maintain interactive and accessible UI: functional filters/gallery/process, keyboard navigation, RTL/LTR, sensible reduced-motion behavior, mobile responsiveness.
8. Avoid unneeded frameworks; if proposing migration to React/Next.js, first justify it and provide a migration plan before changing stack.
9. Consider project enquiries sensitive: ensure privacy notice, anti-spam, security and real endpoint testing before launch.
10. Do not call the form operational until a live production submission has been verified.

## Validation
- Run `cd site && node verify_site.cjs` after modifications.
- Test desktop and mobile views, page navigation, full galleries, EN/AR, keyboard handling and form states in a real browser.
- Report changed files, what was verified, unresolved issues, and what needs client approval.

## Initial request
Start by auditing the supplied implementation against the project brief and visual reference. Give a concise priority-based improvement plan. Then implement the agreed improvements **on the supplied website**, not on a separate unrelated prototype.

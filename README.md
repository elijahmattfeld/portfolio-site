# Elías Mattfeld Campos — Portfolio Site

A static, bilingual (Spanish default / English toggle) personal portfolio site. Plain HTML5, CSS3, and vanilla JavaScript — no backend, no database, no required build step.

## Running it locally

Browsers block `fetch()` of local JSON files when a page is opened directly from disk (`file://`). Serve the folder over local HTTP instead:

```bash
cd portfolio-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`. (Any static server works — `npx serve`, VS Code's Live Server, etc. This is just running a server, not a build step; there is nothing to compile.)

## File structure

```
/index.html, about.html, peace-corps.html, ced-role.html,
/projects.html, project.html, experience.html, gallery.html
/assets/css/styles.css
/assets/js/i18n.js        language toggle logic
/assets/js/main.js        nav, header/footer behavior shared by every page
/assets/js/projects.js    project list filtering/search + detail page rendering
/assets/js/gallery.js     gallery grid + lightbox
/assets/images/           photos and SVG placeholders
/assets/documents/        résumé PDF and other downloadable files
/data/es.json, en.json    every piece of UI/page copy, in both languages
/data/projects.json       project entries (bilingual fields)
/data/experience.json     experience/timeline entries (bilingual fields)
/data/gallery.json        gallery photo entries (starts empty)
/CNAME                    custom-domain hostname for GitHub Pages (empty until you add one)
```

## Adding or editing content

Everything visible on the site lives in `/data/*.json`, not in the HTML. Edit the JSON, save, refresh the page — no build step.

### Add a new project

Add an entry to `data/projects.json`, copying the shape of an existing one. Key fields:

- `slug` — used in the URL (`project.html?slug=your-slug`), must be unique, lowercase-with-hyphens.
- `title`, `summary`, `overview` — bilingual objects: `{ "es": "...", "en": "..." }`.
- `category` — one of the categories used across the site (Entrepreneurship, Financial Literacy, Education, Youth Development, Tourism, Community Outreach, Business Development, Workshop Materials, Graphic Design, Research, Professional Experience) — or a new one; filters pick up categories automatically.
- `location`, `date`, `status` (`planned` / `ongoing` / `completed`), `role`, `partners` — plain fields shown in the detail page's meta list.
- `activities` — array of bilingual objects, the project's "Actividades Realizadas / Activities Completed" bullet list.
- `skills` — array of plain strings shown as badges.
- `featured: true` — shows the project in the homepage "Featured Projects" section (keep it to 1–3 at a time).
- `documents` — array of `{ "label": {"es":"...","en":"..."}, "file": "assets/documents/your-file.pdf" }`.
- `gallery` — array of `{ "image": "assets/images/your-photo.jpg", "alt": {"es":"...","en":"..."} }` shown on the project detail page.
- `relatedProjects` — array of other projects' `slug` values.

The detail page is intentionally kept lean — just overview, activities, and skills, alongside the meta list (location/date/role/partners), photos, and documents. Earlier drafts had more sections (community context, objectives, process, deliverables, outcomes, challenges, lessons, reflections); those were cut in favor of a shorter page.

Never invent numbers, dates, or outcomes — use `"[ADD ...]"` / `"[AÑADIR ...]"` placeholders until you have the real information, matching the existing seed entries.

### Add a new experience entry

Add an entry to `data/experience.json` with the same shape as the existing ones (`organization`, `role`, `location`, `dates`, `summary`, `responsibilities`, `accomplishments`, `skills`). The `type` field (e.g. `"Peace Corps Service"`, `"Work Experience"`, `"Education"`) is just a label shown as a badge on the card — use whatever type fits.

### Edit Skills

Skill groups shown on the Experience page live in `data/es.json` and `data/en.json` under `experience.skillGroups` (and `experience.otherTools` for the free-form tools list) — edit both language files so the two stay in sync.

### Add photos to the gallery

`data/gallery.json` starts as an empty array (`[]`). Add entries shaped like:

```json
{
  "src": "assets/images/gallery/workshop-01.jpg",
  "thumb": "assets/images/gallery/workshop-01-thumb.jpg",
  "project": "youth-entrepreneurship-workshops",
  "caption": { "es": "...", "en": "..." },
  "alt": { "es": "...", "en": "..." }
}
```

`project` is optional and should match a `slug` from `projects.json` if you want the photo filterable by project. `thumb` is optional — omit it to reuse `src` for both the grid and the lightbox.

**Before adding any photo that shows an identifiable person** — students, minors, community members, host families, or project participants — confirm you have their consent to publish it. This is called out in `gallery.html` as well.

### Edit any page copy (headlines, section text, nav labels, footer, disclaimer)

Every string is in `data/es.json` and `data/en.json` under matching key paths (e.g. `home.headline`, `nav.projects`). Edit both files so the two languages stay in sync. If you only have the Spanish copy for something new, add the key to `es.json` and set the `en.json` value to `"[TRANSLATE: ...]"` until you have (or approve) an English version.

## Language toggle

Every page defaults to Spanish. The "ES | EN" button in the header calls `i18n.toggleLang()`, which stores the choice in `localStorage` and re-renders all `[data-i18n]` elements without a page reload — no separate English pages to maintain.

## Images

`assets/images/placeholder-*.svg` are neutral scaffold graphics so the layout looks intentional before real photos are added. Replace them with real photos using the same filenames (or update the `src`/`coverImage` paths in the HTML and JSON). Note: `placeholder-hero.svg` is also used as the Open Graph share image on the homepage — for real link previews (iMessage, Slack, etc.) replace it with an actual JPG/PNG, since not all platforms render SVG previews.

## Résumé

`assets/documents/resume-elias-mattfeld-campos.pdf` is the résumé linked from the "View / Download Résumé" button on the homepage. To update it, replace the file with the same filename, or drop in a new file and update the `href` in `index.html`.

## Deploying

This is a plain static site — any static host works as-is, no build step.

**GitHub Pages**
1. Push this folder to a GitHub repo.
2. Repo Settings → Pages → set the source branch (e.g. `main`) and folder (`/` root).
3. Your site is live at `https://<username>.github.io/<repo>/`.

**Netlify / Vercel**
Drag-and-drop the folder (or connect the repo) — no build command needed, publish directory is the project root.

## Custom domain

The `CNAME` file at the project root is included empty and ready for a custom domain on GitHub Pages: once you have a domain, put just the bare hostname in it (e.g. `www.eliasmattfeld.com`), then add the matching DNS records at your registrar (a `CNAME` record pointing to `<username>.github.io`, or `A` records to GitHub's Pages IPs for an apex domain). Tell your assistant the domain and registrar when you're ready and it can walk through the exact DNS records.

## Hard content rules (keep these when editing)

- Don't invent statistics, participant counts, dates, or outcomes — use `[ADD ...]` / `[AÑADIR ...]` placeholders.
- Keep CED-role language partnership-oriented ("co-facilitated," "collaborated with," "supported," never sole-credit phrasing).
- Both languages must stay in sync — every key in `es.json` should have a matching key in `en.json`, and vice versa.
- The official Peace Corps disclaimer on `peace-corps.html` must stay verbatim in both languages (`peaceCorps.disclaimer` in `data/es.json`/`data/en.json`). It was previously also duplicated in every page footer; that copy was removed by request — the `footer.disclaimer` key still exists in the data files but is no longer rendered anywhere.

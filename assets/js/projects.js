/**
 * projects.js — loads data/projects.json and renders:
 *  - the filterable project library (projects.html)
 *  - featured project cards (index.html)
 *  - a single project detail page (project.html, via ?slug=)
 */
(function () {
  "use strict";

  let allProjects = null;
  const boundListContainers = new Set();
  const boundFeaturedContainers = new Set();
  const boundDetailContainers = new Set();

  async function loadProjects() {
    if (allProjects) return allProjects;
    const res = await fetch("data/projects.json", { cache: "no-cache" });
    allProjects = await res.json();
    return allProjects;
  }

  function localize(field, lang) {
    if (field && typeof field === "object") return field[lang] || field.es || field.en || "";
    return field || "";
  }

  function cardTemplate(project, lang, dict) {
    const title = localize(project.title, lang);
    const summary = localize(project.summary, lang);
    const role = localize(project.role, lang);
    const alt = localize(project.coverImageAlt, lang) || title;
    const statusLabel = (dict.projects && dict.projects.statusOptions && dict.projects.statusOptions[project.status]) || project.status;
    const featuredBadge = project.featured
      ? `<span class="badge badge-accent">${dict.projects.featuredBadge}</span>`
      : "";

    return `
      <article class="card" data-category="${project.category}" data-status="${project.status}">
        <img class="card-image" src="${project.coverImage}" alt="${escapeHtml(alt)}" loading="lazy" />
        <div class="card-body">
          <div class="card-meta">
            <span class="badge">${escapeHtml(project.category)}</span>
            <span class="badge">${escapeHtml(statusLabel)}</span>
            ${featuredBadge}
          </div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(summary)}</p>
          <p class="card-meta">
            <span>${escapeHtml(project.location || "")}</span>
            <span>${escapeHtml(project.date || "")}</span>
          </p>
          ${role ? `<p class="text-muted"><strong>${dict.projects.roleLabel}:</strong> ${escapeHtml(role)}</p>` : ""}
          <a class="btn btn-secondary" href="project.html?slug=${encodeURIComponent(project.slug)}">${dict.projects.viewProject}</a>
        </div>
      </article>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function populateSelect(select, values, allLabel) {
    const current = select.value;
    select.innerHTML = `<option value="">${allLabel}</option>`;
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
    if (values.includes(current)) select.value = current;
  }

  async function renderList(containerId, opts) {
    opts = opts || {};
    const container = document.getElementById(containerId);
    if (!container) return;

    const projects = await loadProjects();
    const lang = window.i18n.getLang();
    const dict = await window.i18n.loadLang(lang);

    const searchInput = document.getElementById("project-search");
    const categorySelect = document.getElementById("filter-category");
    const locationSelect = document.getElementById("filter-location");
    const statusSelect = document.getElementById("filter-status");
    const clearBtn = document.getElementById("clear-filters");
    const emptyState = document.getElementById("projects-empty");

    if (categorySelect) {
      const categories = [...new Set(projects.map((p) => p.category))].sort();
      populateSelect(categorySelect, categories, dict.projects.filterAll);
    }
    if (locationSelect) {
      const locations = [...new Set(projects.map((p) => p.location).filter(Boolean))].sort();
      populateSelect(locationSelect, locations, dict.projects.filterAll);
    }
    if (statusSelect) {
      const statuses = [...new Set(projects.map((p) => p.status))];
      statusSelect.innerHTML = `<option value="">${dict.projects.filterAll}</option>`;
      statuses.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = (dict.projects.statusOptions && dict.projects.statusOptions[s]) || s;
        statusSelect.appendChild(opt);
      });
    }

    function applyFilters() {
      const query = (searchInput && searchInput.value || "").trim().toLowerCase();
      const category = categorySelect ? categorySelect.value : "";
      const location = locationSelect ? locationSelect.value : "";
      const status = statusSelect ? statusSelect.value : "";

      const filtered = projects.filter((p) => {
        const title = localize(p.title, lang).toLowerCase();
        const summary = localize(p.summary, lang).toLowerCase();
        const matchesQuery = !query || title.includes(query) || summary.includes(query) || p.category.toLowerCase().includes(query);
        const matchesCategory = !category || p.category === category;
        const matchesLocation = !location || p.location === location;
        const matchesStatus = !status || p.status === status;
        return matchesQuery && matchesCategory && matchesLocation && matchesStatus;
      });

      container.innerHTML = filtered.map((p) => cardTemplate(p, lang, dict)).join("");
      if (emptyState) emptyState.hidden = filtered.length !== 0;
    }

    applyFilters();

    [searchInput, categorySelect, locationSelect, statusSelect].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", applyFilters);
      el.addEventListener("change", applyFilters);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (categorySelect) categorySelect.value = "";
        if (locationSelect) locationSelect.value = "";
        if (statusSelect) statusSelect.value = "";
        applyFilters();
      });
    }

    if (!boundListContainers.has(containerId)) {
      boundListContainers.add(containerId);
      document.addEventListener("i18n:rendered", () => renderList(containerId, opts));
    }
  }

  async function renderFeatured(containerId, maxCount) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const projects = await loadProjects();
    const lang = window.i18n.getLang();
    const dict = await window.i18n.loadLang(lang);
    const featured = projects.filter((p) => p.featured).slice(0, maxCount || 3);
    container.innerHTML = featured.map((p) => cardTemplate(p, lang, dict)).join("");
    if (!boundFeaturedContainers.has(containerId)) {
      boundFeaturedContainers.add(containerId);
      document.addEventListener("i18n:rendered", () => renderFeatured(containerId, maxCount));
    }
  }

  function listBlock(title, items) {
    if (!items || !items.length) return "";
    const rows = items.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
    return `<h2>${title}</h2><ul>${rows}</ul>`;
  }

  function textBlock(title, text) {
    if (!text) return "";
    return `<div class="project-section"><h2>${title}</h2><p>${escapeHtml(text)}</p></div>`;
  }

  async function renderDetail(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const projects = await loadProjects();
    const lang = window.i18n.getLang();
    const dict = await window.i18n.loadLang(lang);
    const p = projects.find((proj) => proj.slug === slug);

    if (!p) {
      container.innerHTML = `<div class="empty-state"><p>${dict.project.notFound}</p><a class="btn btn-secondary" href="projects.html">${dict.project.backLink}</a></div>`;
      return;
    }

    document.title = `${localize(p.title, lang)} | Elías Mattfeld Campos`;

    const activities = (p.activities || []).map((a) => localize(a, lang));
    const skills = (p.skills || []).map((s) => localize(s, lang));

    const docsHtml = (p.documents || []).length
      ? `<div class="project-section"><h2>${dict.project.documentsTitle}</h2><ul class="doc-list">${p.documents
          .map((d) => `<li><a href="${d.file}" target="_blank" rel="noopener">${escapeHtml(localize(d.label, lang))} (${dict.project.download})</a></li>`)
          .join("")}</ul></div>`
      : "";

    const galleryHtml = (p.gallery || []).length
      ? `<div class="project-section"><h2>${dict.project.galleryTitle}</h2><div class="gallery-grid">${p.gallery
          .map((g) => `<figure class="gallery-item" tabindex="0"><img src="${g.image}" alt="${escapeHtml(localize(g.alt, lang))}" loading="lazy" /></figure>`)
          .join("")}</div></div>`
      : "";

    const relatedHtml = (p.relatedProjects || []).length
      ? `<div class="project-section"><h2>${dict.project.relatedTitle}</h2><div class="card-grid cols-3">${p.relatedProjects
          .map((slugRef) => {
            const rp = projects.find((proj) => proj.slug === slugRef);
            return rp ? cardTemplate(rp, lang, dict) : "";
          })
          .join("")}</div></div>`
      : "";

    const externalLinkHtml = p.externalLink
      ? `<div class="project-section"><h2>${dict.project.externalLinkTitle}</h2><a class="btn btn-secondary" href="${p.externalLink}" target="_blank" rel="noopener">${p.externalLink}</a></div>`
      : "";

    container.innerHTML = `
      <a class="btn btn-secondary" href="projects.html">&larr; ${dict.project.backLink}</a>
      <header style="margin-top: var(--space-4);">
        <div class="card-meta">
          <span class="badge">${escapeHtml(p.category)}</span>
          <span class="badge">${escapeHtml((dict.projects.statusOptions && dict.projects.statusOptions[p.status]) || p.status)}</span>
          ${p.featured ? `<span class="badge badge-accent">${dict.projects.featuredBadge}</span>` : ""}
        </div>
        <h1>${escapeHtml(localize(p.title, lang))}</h1>
      </header>
      <img class="project-hero-image" src="${p.coverImage}" alt="${escapeHtml(localize(p.coverImageAlt, lang))}" loading="lazy" />
      <dl class="project-meta-list">
        <div><dt>${escapeHtml(dict.projects.filterLocation)}</dt><dd>${escapeHtml(p.location || "")}</dd></div>
        <div><dt>${escapeHtml(dict.project.dateLabel)}</dt><dd>${escapeHtml(p.date || "")}</dd></div>
        <div><dt>${dict.project.roleTitle}</dt><dd>${escapeHtml(localize(p.role, lang))}</dd></div>
        <div><dt>${dict.project.partnersTitle}</dt><dd>${escapeHtml((p.partners || []).join(", "))}</dd></div>
      </dl>

      ${textBlock(dict.project.overviewTitle, localize(p.overview, lang))}
      <div class="project-section">${listBlock(dict.project.activitiesTitle, activities)}</div>
      <div class="project-section">${listBlock(dict.project.skillsTitle, skills)}</div>
      ${docsHtml}
      ${galleryHtml}
      ${relatedHtml}
      ${externalLinkHtml}
    `;

    if (!boundDetailContainers.has(containerId)) {
      boundDetailContainers.add(containerId);
      document.addEventListener("i18n:rendered", () => renderDetail(containerId));
    }
  }

  window.ProjectsModule = { loadProjects, renderList, renderFeatured, renderDetail, localize, escapeHtml };
})();

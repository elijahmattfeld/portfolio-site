/**
 * gallery.js — renders the gallery grid from data/gallery.json,
 * with an optional project filter and an accessible lightbox.
 *
 * Content note: get consent before posting identifiable photos of
 * students, minors, community members, host families, or project
 * participants — see data/gallery.json entries before adding images.
 */
(function () {
  "use strict";

  let images = null;
  let currentIndex = 0;
  let currentSet = [];

  async function loadImages() {
    if (images) return images;
    try {
      const res = await fetch("data/gallery.json", { cache: "no-cache" });
      images = res.ok ? await res.json() : [];
    } catch (e) {
      images = [];
    }
    return images;
  }

  function localize(field, lang) {
    if (field && typeof field === "object") return field[lang] || field.es || field.en || "";
    return field || "";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  async function renderGallery(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const items = await loadImages();
    const lang = window.i18n.getLang();
    const dict = await window.i18n.loadLang(lang);
    const filterSelect = document.getElementById("gallery-filter");
    const emptyState = document.getElementById("gallery-empty");

    if (filterSelect && !filterSelect.dataset.bound) {
      const projects = [...new Set(items.map((i) => i.project).filter(Boolean))].sort();
      filterSelect.innerHTML = `<option value="">${dict.gallery.filterAll}</option>`;
      projects.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        filterSelect.appendChild(opt);
      });
      filterSelect.dataset.bound = "true";
      filterSelect.addEventListener("change", () => draw());
    }

    function draw() {
      const filter = filterSelect ? filterSelect.value : "";
      const filtered = items.filter((i) => !filter || i.project === filter);
      currentSet = filtered;

      if (!filtered.length) {
        grid.innerHTML = "";
        if (emptyState) emptyState.hidden = false;
        return;
      }
      if (emptyState) emptyState.hidden = true;

      grid.innerHTML = filtered
        .map((img, idx) => {
          const caption = localize(img.caption, lang);
          const alt = localize(img.alt, lang) || caption;
          return `
            <figure>
              <button type="button" class="gallery-item" data-index="${idx}" aria-label="${escapeHtml(caption || alt)}">
                <img src="${img.thumb || img.src}" alt="${escapeHtml(alt)}" loading="lazy" />
              </button>
              <figcaption>${escapeHtml(caption)}</figcaption>
            </figure>
          `;
        })
        .join("");

      grid.querySelectorAll(".gallery-item").forEach((btn) => {
        btn.addEventListener("click", () => openLightbox(Number(btn.dataset.index)));
      });
    }

    draw();

    if (!grid.dataset.i18nBound) {
      grid.dataset.i18nBound = "true";
      document.addEventListener("i18n:rendered", () => renderGallery(gridId));
    }
  }

  function openLightbox(index) {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox || !currentSet.length) return;
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add("is-open");
    lightbox.querySelector(".lightbox-close").focus();
    document.addEventListener("keydown", handleKeydown);
  }

  function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.removeEventListener("keydown", handleKeydown);
  }

  async function updateLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    const lang = window.i18n.getLang();
    const img = currentSet[currentIndex];
    const imgEl = lightbox.querySelector(".lightbox-content img");
    const captionEl = lightbox.querySelector(".lightbox-caption");
    imgEl.src = img.src;
    imgEl.alt = localize(img.alt, lang) || localize(img.caption, lang);
    captionEl.textContent = localize(img.caption, lang);
  }

  function handleKeydown(e) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % currentSet.length;
    updateLightbox();
  }
  function showPrev() {
    currentIndex = (currentIndex - 1 + currentSet.length) % currentSet.length;
    updateLightbox();
  }

  function setupLightboxControls() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-next").addEventListener("click", showNext);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", showPrev);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  window.GalleryModule = { renderGallery, setupLightboxControls };
})();

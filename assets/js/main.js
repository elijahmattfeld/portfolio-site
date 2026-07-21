/**
 * main.js — shared behavior across all pages:
 * mobile nav toggle, active-link highlighting, language toggle button.
 */
(function () {
  "use strict";

  function setActiveNavLink() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function setupNavToggle() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 767px)").matches) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  function setupLangToggle() {
    const buttons = document.querySelectorAll(".lang-toggle");
    if (!buttons.length || !window.i18n) return;

    function updateLabels() {
      const next = window.i18n.getLang() === "es" ? "EN" : "ES";
      buttons.forEach((btn) => {
        btn.textContent = next;
        btn.setAttribute(
          "aria-label",
          window.i18n.getLang() === "es" ? "Switch site language to English" : "Cambiar el idioma del sitio a español"
        );
      });
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        window.i18n.toggleLang();
      });
    });

    document.addEventListener("i18n:rendered", updateLabels);
    updateLabels();
  }

  document.addEventListener("DOMContentLoaded", () => {
    setActiveNavLink();
    setupNavToggle();
    setupLangToggle();
    if (window.i18n) {
      window.i18n.translatePage();
    }
  });
})();

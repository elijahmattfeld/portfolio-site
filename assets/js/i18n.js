/**
 * i18n.js — language toggle logic.
 * Default language: Spanish (es). Persists choice in localStorage.
 * Exposes window.i18n with: getLang, setLang, t, translatePage, ready (promise), onChange.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "site-lang";
  const DEFAULT_LANG = "es";
  const SUPPORTED = ["es", "en"];

  const cache = {};
  const listeners = [];

  function dataPath(lang) {
    return "data/" + lang + ".json";
  }

  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored) ? stored : DEFAULT_LANG;
  }

  async function loadLang(lang) {
    if (cache[lang]) return cache[lang];
    const res = await fetch(dataPath(lang), { cache: "no-cache" });
    if (!res.ok) throw new Error("Could not load language file: " + lang);
    const json = await res.json();
    cache[lang] = json;
    return json;
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  async function t(key) {
    const lang = getLang();
    const dict = await loadLang(lang);
    const value = getByPath(dict, key);
    return value !== undefined ? value : key;
  }

  function applyTranslations(dict) {
    document.documentElement.setAttribute("lang", getLang());

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = getByPath(dict, key);
      if (value === undefined) return;
      if (typeof value === "string") {
        el.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      spec.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (!attr || !key) return;
        const value = getByPath(dict, key);
        if (typeof value === "string") {
          el.setAttribute(attr, value);
        }
      });
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      const value = getByPath(dict, key);
      if (typeof value === "string") {
        el.innerHTML = value;
      }
    });
  }

  async function translatePage() {
    const lang = getLang();
    const dict = await loadLang(lang);
    applyTranslations(dict);
    document.dispatchEvent(new CustomEvent("i18n:rendered", { detail: { lang, dict } }));
    return dict;
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    const dict = await translatePage();
    listeners.forEach((fn) => fn(lang, dict));
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function toggleLang() {
    const current = getLang();
    const next = current === "es" ? "en" : "es";
    setLang(next);
  }

  window.i18n = {
    getLang,
    setLang,
    toggleLang,
    t,
    translatePage,
    onChange,
    loadLang,
    getByPath,
  };
})();

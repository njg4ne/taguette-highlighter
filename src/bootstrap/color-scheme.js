/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2025 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */
const setupVanillaColorMode = () => {
  "use strict";

  const getStoredTheme = () => localStorage.getItem("theme");
  const setStoredTheme = (theme) => localStorage.setItem("theme", theme);

  const getBrowserTheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    return getBrowserTheme();
  };

  const setTheme = (theme) => {
    if (theme === "auto") {
      document.documentElement.setAttribute(
        "data-bs-theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
      );
    } else {
      document.documentElement.setAttribute("data-bs-theme", theme);
    }
  };

  setTheme(getPreferredTheme());

  const showActiveTheme = (theme, focus = false) => {
    // const themeSwitcher = document.querySelector("#bd-theme");

    // if (!themeSwitcher) {
    //   return;
    // }

    // const themeSwitcherText = document.querySelector("#bd-theme-text");
    // const activeThemeIcon = document.querySelector(".theme-icon-active use");
    const btnToActive = document.querySelector(
      `[data-bs-theme-value="${theme}"]`
    );
    // const svgOfActiveBtn = btnToActive
    //   .querySelector("svg use")
    //   .getAttribute("href");

    document.querySelectorAll("[data-bs-theme-value]").forEach((element) => {
      element.classList.remove("active");
      element.setAttribute("aria-pressed", "false");
    });

    btnToActive?.classList.add("active");
    btnToActive?.setAttribute("aria-pressed", "true");
    // activeThemeIcon.setAttribute("href", svgOfActiveBtn);
    // const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`;
    // themeSwitcher.setAttribute("aria-label", themeSwitcherLabel);

    // if (focus) {
    //   themeSwitcher.focus();
    // }
  };

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const storedTheme = getStoredTheme();
      if (storedTheme !== "light" && storedTheme !== "dark") {
        setTheme(getPreferredTheme());
      }
    });

  function initializeColorModeTogglers() {
    // console.log(document.querySelectorAll("[data-bs-theme-value]"));
    showActiveTheme(getPreferredTheme());

    document.querySelectorAll("[data-bs-theme-value]").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const theme = toggle.getAttribute("data-bs-theme-value");
        setStoredTheme(theme);
        setTheme(theme);
        showActiveTheme(theme, true);
      });
    });
  }
  window.addEventListener("DOMContentLoaded", initializeColorModeTogglers);
  return {
    getStoredTheme,
    setStoredTheme,
    getBrowserTheme,
    getPreferredTheme,
    setTheme,
    initializeColorModeTogglers,
  };
};
// export const exports = setupVanillaColorMode();
export default setupVanillaColorMode;

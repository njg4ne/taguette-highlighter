import { useEffect, useState } from "react";
import setupVanillaColorMode from "../bootstrap/color-scheme";
const { initializeColorModeTogglers, getPreferredTheme, getBrowserTheme } =
  setupVanillaColorMode();

export default function ThemePicker() {
  useEffect(() => {
    initializeColorModeTogglers();
  }, []);
  return (
    <div
      className="input-group btn-group w-auto"
      aria-labelledby="theme-btn-group-label"
      role="group"
      aria-label="Theme"
    >
      <span className="input-group-text" id="theme-btn-group-label">
        Theme
      </span>
      <ThemeChoice theme="auto" />
      <ThemeChoice theme="light" />
      <ThemeChoice theme="dark" />
    </div>
  );
}

function useBrowserTheme() {
  const [bt, setBt] = useState(getBrowserTheme());
  useEffect(() => {
    const handleChange = (e) => {
      setBt(e.matches ? "dark" : "light");
    };
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", handleChange);
    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, []);
  return bt;
}

function ThemeChoice({ theme } = { theme: "auto" }) {
  const activeAndPressed = theme === getPreferredTheme();
  const browserTheme = useBrowserTheme();
  const btnTheme = theme === "auto" ? browserTheme : theme;
  const bProps = {
    className: `btn btn-${btnTheme}`,
    "data-bs-theme-value": theme,
    "data-bs-toggle": "button",
    type: "button",
    // "data-bs-theme": theme,
  };
  if (activeAndPressed) {
    bProps["aria-pressed"] = "true";
    bProps["className"] += " active";
  }

  return <button {...bProps}>{titleCase(theme)}</button>;
}

function titleCase(str) {
  return str.toLowerCase().replace(/(^|\s)\S/g, function (match) {
    return match.toUpperCase();
  });
}

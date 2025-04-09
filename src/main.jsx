import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ThemeToggle from "./components/ThemeToggle";
import "./index.css";

import "./bootstrap";
import DocumentView from "./DocumentView";

createRoot(document.querySelector("body")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

function App() {
  return (
    <>
      <header>
        <Nav />
        {/* <nav className="navbar navbar-expand-md">
          <h1>
            <a href="/">Page Title (App Name) H1</a>
            <ThemeToggle />
          </h1>
        </nav> */}
      </header>
      <main>
        <DocumentView />
      </main>
      <footer>Footer</footer>
    </>
  );
}

function Nav() {
  return (
    <nav className="navbar navbar-expand-sm bg-body-tertiary">
      <div className="container-fluid">
        <a className="navbar-brand" href="/template-vite-react-js/">
          Taguette Highlighter
        </a>
        <ThemeToggle />
        {/* <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbar-collabsible"
          aria-controls="navbar-collabsible"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbar-collabsible">
          <ThemeToggle />
        </div> */}
      </div>
    </nav>
  );
}

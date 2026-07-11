import { useState } from "react";
import { Link } from "react-router-dom";

export function Nav() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("ozby-theme", next);
    setTheme(next);
  };

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        <span className="only-light">
          OZBY<span className="nav-logo-tld">.DEV</span>
        </span>
        <span className="only-dark">
          ozby<span className="nav-logo-tld">@dev</span>
          <span className="nav-logo-host">:~$</span>
        </span>
      </Link>
      <div className="nav-links">
        <Link to="/writing" className="nav-link">
          Writing
        </Link>
        <Link to="/contact" className="nav-link">
          Contact
        </Link>
        <a
          href="https://github.com/ozby"
          className="nav-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://linkedin.com/in/ozberk-ercin/"
          className="nav-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <button className="nav-link" type="button" onClick={toggleTheme}>
          {theme === "dark" ? "[light]" : "[dark]"}
        </button>
      </div>
    </nav>
  );
}

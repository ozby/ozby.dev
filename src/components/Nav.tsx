import { Link } from 'react-router-dom'

export function Nav() {
  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        OZBY<span className="nav-logo-tld">.DEV</span>
      </Link>
      <div className="nav-links">
        <Link to="/writing" className="nav-link">
          Writing
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
      </div>
    </nav>
  )
}

import { Link } from 'react-router-dom'
import { posts } from '../lib/posts'
import { projects } from '../projects'

const stats = [
  { value: '25', label: 'years writing code', accent: true },
  { value: '15M+', label: 'users @ ResearchGate' },
  { value: '60k+', label: 'patients on Emilyn' },
  { value: '#1', label: 'MS app, both stores' },
]

const career = [
  { year: '2024', role: 'Contract — LLM & product', note: 'product development, MVP builds, LLM architecture, CI/CD — early-stage AI startups', current: true },
  { year: '2024', role: 'Career break', note: 'SE Asia & the Caribbean, Jan–Jul' },
  { year: '2022', role: 'Head of Engineering · Mymee', note: 'post-acquisition, two multinational teams — through Dec 2023' },
  { year: '2018', role: 'Founding engineer · Breakthrough Health', note: 'built Emilyn — #1 MS app, 60k+ patients, acquired 2022' },
  { year: '2016', role: 'Senior Software Engineer · ResearchGate', note: 'Growth — 100% organic traffic increase in 2 years, 15M+ users, top-40 Alexa' },
  { year: '2015', role: 'Founding engineer · SevenSenders', note: 'Berlin logistics scale-up, from zero' },
  { year: '2013', role: 'GetYourGuide', note: 'hypergrowth — navigating the chaos and extreme pace' },
  { year: '2012', role: 'Rocket Internet · Plinga', note: 'hypergrowth — navigating the chaos and extreme pace' },
  { year: '2009', role: 'MegaUpload', note: '~10% of global internet traffic — hired after Load2all' },
  { year: '2007', role: 'Load2all', note: 'mass file spreader to hosts like Rapidshare & MegaUpload', url: 'https://www.ghacks.net/2009/11/23/upload-files-to-multiple-file-hosting-services-with-load2all/' },
  { year: '2005', role: 'Linux, FreeBSD · plazmaweb.net', note: 'hosting + Counter-Strike servers', url: 'https://web.archive.org/web/20060901030903/http://www.plazmaweb.net/index.php' },
  { year: '2003', role: 'PHP, MySQL · e-muzzik.com', note: 'Turkish music portal', url: 'https://web.archive.org/web/20031208192541/http://e-muzzik.com/' },
  { year: '2001', role: 'Geocities, FrontPage', note: 'first pages, age 10' },
]

export function Home() {
  const recent = posts.slice(0, 3)

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">
          <span className="only-dark">$ whoami</span>
          <span className="only-light">Software engineer — est. 2001</span>
        </p>
        <h1 className="hero-title">
          <span className="only-light">
            Özberk<br />Erçin<span className="accent">.</span>
          </span>
          <span className="only-dark">
            25 years of<br />shipping software<span className="cursor-block" />
          </span>
        </h1>
        <div className="hero-foot">
          <p className="hero-sub">
            Founding engineer ×2, head of engineering, hypergrowth survivor. From Geocities at 10
            to agent harnesses in 2026 — these days I build LLM infrastructure for early-stage AI
            startups.
          </p>
          <span className="hero-meta">Berlin · Çanakkale</span>
        </div>
      </section>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-cell">
            <div className={`stat-value${s.accent === true ? ' accent' : ''}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="section-block">
        <div className="section-label">
          <span className="only-light label-light">Career<span className="slash">/</span></span>
          <span className="only-dark label-dark">$ git log --career</span>
        </div>
        <div>
          {career.map((entry) => (
            <div key={entry.year} className="career-row">
              <span className={`career-year${entry.current === true ? ' current' : ''}`}>{entry.year}</span>
              {entry.url != null ? (
                <a className="career-role career-role-link" href={entry.url} target="_blank" rel="noopener noreferrer">{entry.role}</a>
              ) : (
                <span className="career-role">{entry.role}</span>
              )}
              <span className="career-note">{entry.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-label">
          <span className="only-light label-light">Work<span className="slash">/</span></span>
          <span className="only-dark label-dark">$ ls ~/projects</span>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <Link key={project.slug} to={`/projects/${project.slug}`} className="project-card">
              <div className="project-name">
                <span className="only-dark">{project.name}/</span>
                <span className="only-light">
                  {project.name} <span className="arrow">↗</span>
                </span>
              </div>
              <p className="project-desc">{project.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block flush">
        <div className="section-label">
          <span className="only-light label-light">Writing<span className="slash">/</span></span>
          <span className="only-dark label-dark">$ tail -f writing.log</span>
        </div>
        {recent.length === 0 ? (
          <p className="empty-state">No posts yet — check back soon.</p>
        ) : (
          <ul className="post-list">
            {recent.map((post) => (
              <li key={post.slug} className="post-item">
                <div className="post-item-top">
                  <Link to={`/writing/${post.slug}`} className="post-link">
                    {post.title}
                  </Link>
                  <time className="post-date" dateTime={post.date}>
                    {post.date}
                  </time>
                </div>
                {post.description !== undefined && post.description !== '' && (
                  <p className="post-description">{post.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="list-aside">more to follow. no promises on cadence.</p>
      </section>
    </>
  )
}

import { Link } from "react-router-dom";
import { posts } from "#lib/posts";
import { projects } from "#projects";

const stats = [
  { value: "25", label: "years building software", accent: true },
  { value: "2×", label: "founding engineer" },
  { value: "15M+", label: "active users · ResearchGate growth" },
  { value: "60k+", label: "patients · #1 multiple sclerosis app" },
];

const career = [
  {
    year: "2024",
    role: "Fractional CTO · AI startups",
    note: "CTO for a climate-tech company; hybrid Kubernetes platforms, Temporal orchestration, and LLM infrastructure for early-stage AI startups",
    current: true,
  },
  { year: "2024", role: "Career break", note: "SE Asia & the Caribbean, Jan–Jul" },
  {
    year: "2022",
    role: "Head of Engineering · Mymee",
    note: "merged two engineering teams post-acquisition into one org, shipped the combined mobile product — and kept coding 2–4 days a week",
  },
  {
    year: "2018",
    role: "Founding engineer · Breakthrough Health",
    note: "built Emilyn — the #1 multiple sclerosis app on iOS & Android, 60k+ patients, acquired by Mymee in 2022",
  },
  {
    year: "2016",
    role: "Senior Software Engineer · ResearchGate",
    note: "growth data & ML pipelines, A/B testing and traffic-experiment frameworks — organic traffic doubled in 2 years to 15M+ active users; led Hadoop→Flink and YUI→React migrations",
  },
  {
    year: "2015",
    role: "Founding engineer · SevenSenders",
    note: "first hire — AWS infrastructure and the shipment-tracking MVP that landed the first customers",
  },
  {
    year: "2013",
    role: "Software Engineer · GetYourGuide",
    note: "built the A/B testing framework from scratch, multi-language ElasticSearch, search-conversion work",
  },
  {
    year: "2012",
    role: "Software Engineer · Rocket Internet (Plinga)",
    note: "payments & campaign API integrations for social games, internal tooling",
  },
  {
    year: "2009",
    role: "MegaUpload",
    note: "hired off Load2all — server monitoring for a platform carrying ~10% of internet traffic",
  },
  {
    year: "2007",
    role: "Load2all",
    note: "distributed upload automation for major file-hosting platforms",
    url: "https://www.ghacks.net/2009/11/23/upload-files-to-multiple-file-hosting-services-with-load2all/",
  },
  {
    year: "2005",
    role: "plazmaweb.net",
    note: "Linux/FreeBSD hosting, networking, and game-server operations",
    url: "https://web.archive.org/web/20060901030903/http://www.plazmaweb.net/index.php",
  },
  {
    year: "2003",
    role: "e-muzzik.com",
    note: "Turkish music portal — PHP/MySQL product and operations",
    url: "https://web.archive.org/web/20031208192541/http://e-muzzik.com/",
  },
  { year: "2001", role: "Geocities, FrontPage", note: "first shipped web pages, age 10" },
];

export function Home() {
  const recent = posts.slice(0, 3);

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">
          <span className="only-dark">$ whoami</span>
          <span className="only-light">
            Principal Engineer · Head of Engineering · CTO — hands-on since 2001
          </span>
        </p>
        <h1 className="hero-title">
          <span className="only-light">
            Özberk
            <br />
            Erçin<span className="accent">.</span>
          </span>
          <span className="only-dark">
            25 years in,
            <br />
            still shipping
            <span className="cursor-block" />
          </span>
        </h1>
        <div className="hero-foot">
          <p className="hero-sub">
            Head of Engineering and CTO, still hands-on as a principal engineer. I have spent 25
            years taking products from first commit to production: growth engineering for
            ResearchGate&apos;s 15M users, a multiple-sclerosis app from launch to acquisition, and
            post-merger teams at Mymee. Today I run engineering for AI startups and build their
            cloud platforms and LLM infrastructure.
          </p>
          <span className="hero-meta">Berlin · Çanakkale</span>
        </div>
      </section>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-cell">
            <div className={`stat-value${s.accent === true ? " accent" : ""}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="section-block">
        <div className="section-label">
          <span className="only-light label-light">
            Career<span className="slash">/</span>
          </span>
          <span className="only-dark label-dark">$ git log --career</span>
        </div>
        <div>
          {career.map((entry) => (
            <div key={entry.role} className="career-row">
              <span className={`career-year${entry.current === true ? " current" : ""}`}>
                {entry.year}
              </span>
              {entry.url != null ? (
                <a
                  className="career-role career-role-link"
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {entry.role}
                </a>
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
          <span className="only-light label-light">
            Work<span className="slash">/</span>
          </span>
          <span className="only-dark label-dark">$ ls ~/systems</span>
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
          <span className="only-light label-light">
            Writing<span className="slash">/</span>
          </span>
          <span className="only-dark label-dark">$ tail -f writing.log</span>
        </div>
        {recent.length === 0 ? (
          <p className="empty-state">No essays published yet.</p>
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
                {post.description !== undefined && post.description !== "" && (
                  <p className="post-description">{post.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="list-aside">
          Occasional notes on engineering leadership, developer experience, and AI-assisted
          delivery.
        </p>
      </section>
    </>
  );
}

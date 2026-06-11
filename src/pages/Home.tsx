import { Link } from 'react-router-dom'
import { posts } from '../lib/posts'
import { projects } from '../projects'

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function Home() {
  const recent = posts.slice(0, 3)

  return (
    <>
      <section className="hero">
        <h1 className="hero-name">Özberk Erçin</h1>
        <p className="hero-bio">
          20+ years in software, starting at age 12. At 21, a personal file-sharing project
          landed a job at Megaupload — one of the most trafficked sites on the internet at the
          time. Since then: Rocket Internet, GetYourGuide (left to join SevenSenders as founding
          engineer and first hire), ResearchGate (15M+ users, top-40 Alexa), founding engineer at
          Breakthrough Health — started with ResearchGate colleagues (60k+ MS patients), Head of
          Engineering at Mymee.
          <br />
          <br />
          Most recently: LLM infrastructure and Kubernetes for early-stage AI startups, and AI
          coding agent harness development (see{' '}
          <Link to="/projects/agent-kit">agent-kit</Link>). Raised in Istanbul, based in Berlin, occasionally in Çanakkale.
          <br />
          <br />
          I write about engineering, infrastructure, and AI coding practices.
        </p>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Writing</h2>
          <Link to="/writing" className="section-link">
            All posts →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="empty-state">No posts yet — check back soon.</p>
        ) : (
          <ul className="post-list">
            {recent.map((post) => (
              <li key={post.slug} className="post-item">
                <Link to={`/writing/${post.slug}`} className="post-link">
                  {post.title}
                </Link>
                <time className="post-date" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Projects</h2>
        </div>
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.slug} className="project-item">
              <Link to={`/projects/${project.slug}`} className="project-link">
                {project.name}
              </Link>
              <span className="project-summary">{project.summary}</span>
              <Link to={`/projects/${project.slug}`} className="project-arrow" aria-hidden="true">
                →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

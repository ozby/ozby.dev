import { Link } from 'react-router-dom'
import { formatDate } from '../lib/format'
import { posts } from '../lib/posts'
import { projects } from '../projects'

export function Home() {
  const recent = posts.slice(0, 3)

  return (
    <>
      <section className="hero">
        <p className="hero-intro">Özberk Erçin — software engineer.</p>
        <div className="hero-bio">
          <p>
            Born in Istanbul. Got my first computer at eight — an Intel Pentium MMX SL27S,
            233MHz/66MHz, 32MB RAM. By 10 I was making static pages on Geocities and Lycos,
            then found Microsoft FrontPage bundled on the machine. That lasted about a week.
            Hand-written HTML, then CSS, then PHP. By 13 I had real sites with real visitors
            —{' '}
            <a href="https://web.archive.org/web/20031208192541/http://e-muzzik.com/" target="_blank" rel="noopener noreferrer">e-muzzik.com</a>
            {' '}was one, a Turkish music portal. Internet was still rare in early 2000s Türkiye,
            so anything genuinely useful could reach a lot of people. Around 15 I got into Linux
            and ended up running{' '}
            <a href="https://web.archive.org/web/20060901030903/http://www.plazmaweb.net/index.php" target="_blank" rel="noopener noreferrer">plazmaweb.net</a>
            {' '}— a hosting operation on Linux and FreeBSD with cPanel and Counter-Strike servers.
          </p>
          <p>
            Stumbled across the{' '}
            <a href="https://curl.se" target="_blank" rel="noopener noreferrer">cURL library</a>
            {' '}at some point and my jaw genuinely dropped. Every server on the internet,
            suddenly reachable by script. Hacked together{' '}
            <a href="https://www.ghacks.net/2009/11/23/upload-files-to-multiple-file-hosting-services-with-load2all/" target="_blank" rel="noopener noreferrer">Load2all</a>
            {' '}within days and put it online. A brief stint at Megaupload, then Berlin: Rocket
            Internet, GetYourGuide, founding engineer at SevenSenders, ResearchGate (15M+ users,
            top-40 Alexa). Then Breakthrough Health — a Berlin MS startup where I was the founding
            engineer. We built Emilyn, the #1 MS app on both stores, top ratings, 60k+ patients.
            Mymee acquired us in 2022; I stayed on as Head of Engineering, leading two multinational
            cross-functional teams across their autoimmune and long COVID platform.
          </p>
          <p>
            Spent about four years as a digital nomad — Southeast Asia, the Caribbean, the Indian
            Ocean, the Greek islands. Love swimming and the ocean; beach over mountains, every time.
            Back in Berlin now, occasionally in Çanakkale. These days: LLM infrastructure and
            DevOps/DevEx consultancy for early-stage AI startups, as both advisor and hands-on
            builder working directly with founding teams. Since early 2026 I&rsquo;ve been deep in
            AI coding agent harnesses — some of that work lives in{' '}
            <Link to="/projects/agent-kit">agent-kit</Link>.
          </p>
          <p>I write about engineering, infrastructure, and AI — or whatever else seems worth writing about. No promises on cadence.</p>
        </div>
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
                <div className="post-item-top">
                  <Link to={`/writing/${post.slug}`} className="post-link">
                    {post.title}
                  </Link>
                  <time className="post-date" dateTime={post.date}>
                    {formatDate(post.date)}
                  </time>
                </div>
                {post.description && (
                  <p className="post-description">{post.description}</p>
                )}
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
              <Link
                to={`/projects/${project.slug}`}
                className="project-arrow"
                aria-hidden="true"
              >
                →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

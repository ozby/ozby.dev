import { Link, useParams } from "react-router-dom";
import { projects } from "#projects";
import { renderMarkdown } from "#lib/markdown";

export function Project() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="not-found">
        <h1>Project not found</h1>
        <p>
          <Link to="/">← Home</Link>
        </p>
      </div>
    );
  }

  const whyHtml = renderMarkdown(project.why);

  return (
    <>
      <Link to="/" className="back-link">
        ← Home
      </Link>

      <div className="project-detail-header">
        <h1 className="project-detail-title">{project.name}</h1>
        <p className="project-detail-tagline">{project.summary}</p>

        <div className="project-detail-actions">
          {project.demoUrl !== undefined && (
            <a
              href={project.demoUrl}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Live demo ↗
            </a>
          )}
          <a href={project.url} className="btn" target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        </div>

        <ul className="tech-chips">
          {project.tech.map((t) => (
            <li key={t} className="tech-chip">
              {t}
            </li>
          ))}
        </ul>
      </div>

      {project.screenshots !== undefined && project.screenshots.length > 0 && (
        <div className="screenshots">
          {project.screenshots.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${project.name} screenshot ${String(i + 1)}`}
              className="screenshot"
              loading="lazy"
            />
          ))}
        </div>
      )}

      <section>
        <h2 className="why-heading">Why I built this</h2>
        <div className="prose" dangerouslySetInnerHTML={{ __html: whyHtml }} />
      </section>
    </>
  );
}

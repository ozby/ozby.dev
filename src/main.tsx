import { createRoot } from "react-dom/client";
import { projects } from "./projects";
import "./styles.css";

function App() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">ozby.dev</p>
        <h1>Building agent-native developer tools on real Cloudflare apps.</h1>
        <p>Personal dev site and strict @webpresso/agent-kit dogfood target.</p>
      </section>
      <section className="projects" aria-label="Projects">
        {projects.map((project) => (
          <a className="card" href={project.url} key={project.slug}>
            <h2>{project.name}</h2>
            <p>{project.summary}</p>
          </a>
        ))}
      </section>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(<App />);

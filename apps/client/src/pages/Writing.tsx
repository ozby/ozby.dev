import { Link } from "react-router-dom";
import { formatDate } from "#lib/format";
import { posts } from "#lib/posts";

function getYear(date: string): string {
  return new Date(date).getFullYear().toString();
}

export function Writing() {
  if (posts.length === 0) {
    return (
      <>
        <h1 className="page-title">Writing</h1>
        <p className="empty-state">No essays published yet.</p>
      </>
    );
  }

  const byYear = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const year = getYear(post.date);
    const existing = acc[year];
    acc[year] = existing ? [...existing, post] : [post];
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <>
      <h1 className="page-title">Writing</h1>
      {years.map((year) => (
        <div key={year} className="year-group">
          <h2 className="year-heading">{year}</h2>
          <ul className="post-list">
            {byYear[year]?.map((post) => (
              <li key={post.slug} className="post-item">
                <div className="post-item-top">
                  <Link to={`/writing/${post.slug}`} className="post-link">
                    {post.title}
                  </Link>
                  <time className="post-date" dateTime={post.date}>
                    {formatDate(post.date)}
                  </time>
                </div>
                {post.description && <p className="post-description">{post.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

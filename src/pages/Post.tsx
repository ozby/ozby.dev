import { Link, useParams } from 'react-router-dom'
import { formatDate } from '#lib/format'
import { posts } from '#lib/posts'

export function Post() {
  const { slug } = useParams<{ slug: string }>()
  const post = posts.find((p) => p.slug === slug)

  if (!post) {
    return (
      <div className="not-found">
        <h1>Post not found</h1>
        <p>
          <Link to="/writing">← Back to writing</Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <Link to="/writing" className="back-link">
        ← Writing
      </Link>
      <article>
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <time dateTime={post.date}>{formatDate(post.date, 'long')}</time>
            <span>·</span>
            <span>{post.readTime} min read</span>
          </div>
        </header>
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </>
  )
}

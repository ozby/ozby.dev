import matter from 'gray-matter'
import { renderMarkdown } from './markdown'
import type { Post } from './types'

const rawFiles = import.meta.glob<string>('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function buildPosts(): Post[] {
  return Object.entries(rawFiles)
    .map(([path, raw]) => {
      const { data, content } = matter(raw)
      const slug = path.replace('../content/posts/', '').replace('.md', '')
      const wordCount = content.split(/\s+/).filter(Boolean).length
      const readTime = Math.max(1, Math.ceil(wordCount / 200))
      const html = renderMarkdown(content)
      return {
        slug,
        title: typeof data['title'] === 'string' ? data['title'] : slug,
        date: typeof data['date'] === 'string' ? data['date'] : '',
        description: typeof data['description'] === 'string' ? data['description'] : '',
        published: data['published'] !== false,
        html,
        readTime,
      } satisfies Post
    })
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const posts: Post[] = buildPosts()

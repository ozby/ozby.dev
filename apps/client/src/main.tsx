import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import 'highlight.js/styles/github-dark.css'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Writing } from './pages/Writing'
import { Post } from './pages/Post'
import { Project } from './pages/Project'
import { Contact } from './pages/Contact'
import './styles.css'

function NotFound() {
  return (
    <div className="not-found">
      <h1>Page not found</h1>
      <p>
        The page you&apos;re looking for doesn&apos;t exist.{' '}
        <a href="/">Go home</a>
      </p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="page">
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/writing/:slug" element={<Post />} />
            <Route path="/projects/:slug" element={<Project />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

const rootEl = document.getElementById('root')
if (rootEl === null) throw new Error('Missing #root element')
createRoot(rootEl).render(<App />)

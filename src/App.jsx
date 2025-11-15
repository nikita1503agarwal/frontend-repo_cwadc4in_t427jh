import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Reusable UI bits
function Badge({ children, color = 'indigo' }) {
  const bg = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    green: 'bg-green-50 text-green-700 ring-green-600/20',
    gray: 'bg-gray-50 text-gray-700 ring-gray-600/20',
    amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    violet: 'bg-violet-50 text-violet-700 ring-violet-600/20'
  }[color] || 'bg-indigo-50 text-indigo-700 ring-indigo-600/20'
  return (
    <span className={`inline-flex items-center rounded-full ${bg} px-3 py-1 text-xs font-medium ring-1 ring-inset`}>
      {children}
    </span>
  )
}

function Nav({ active, onChange }) {
  const tabs = [
    { id: 'videos', label: 'Vidéos' },
    { id: 'forum', label: 'Forum' },
    { id: 'progress', label: 'Progression' },
  ]
  return (
    <nav className="mt-6 border-b">
      <ul className="-mb-px flex gap-6 text-sm">
        {tabs.map(t => (
          <li key={t.id}>
            <button
              onClick={() => onChange(t.id)}
              className={`${active === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'} border-b-2 px-1.5 pb-2 font-medium`}
            >{t.label}</button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function VideoCard({ v, onTrack }) {
  return (
    <div className="group rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{v.title}</h3>
        <Badge>{v.level}</Badge>
      </div>
      <p className="line-clamp-2 text-sm text-gray-600 mb-3">{v.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="space-x-2">
          {(v.topics || []).slice(0,3).map(t => (
            <span key={t} className="rounded bg-gray-100 px-2 py-0.5">{t}</span>
          ))}
        </div>
        <span>{v.duration_sec ? Math.round(v.duration_sec/60)+' min' : ''}</span>
      </div>
      <a href={v.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Regarder</a>
      <button onClick={() => onTrack(v)} className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
        Marquer comme regardé
      </button>
    </div>
  )
}

function ForumPostCard({ post }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">{post.title}</h4>
        <div className="flex gap-1">
          {(post.topics || []).map(t => (
            <Badge key={t} color="gray">{t}</Badge>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-line">{post.content}</p>
      <div className="mt-2 text-xs text-gray-500">Auteur: {post.user_id}</div>
    </div>
  )
}

function CreatePostForm({ onCreate, loading }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topics, setTopics] = useState('technique,question')

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h4 className="mb-2 font-semibold">Nouveau post</h4>
      <div className="grid gap-3">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre" className="w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Contenu" rows={4} className="w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <input value={topics} onChange={e=>setTopics(e.target.value)} placeholder="Tags séparés par des virgules" className="w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <button disabled={loading || !title || !content} onClick={()=> onCreate({ title, content, topics: topics.split(',').map(s=>s.trim()).filter(Boolean) })} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? 'Publication…' : 'Publier'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [active, setActive] = useState('videos')
  const [videos, setVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [userId] = useState('demo-user-1')
  const [progressMap, setProgressMap] = useState({})
  const [creatingSeed, setCreatingSeed] = useState(false)

  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [creatingPost, setCreatingPost] = useState(false)

  const watchedCount = useMemo(() => Object.values(progressMap).filter(p => p >= 100).length, [progressMap])

  const loadVideos = async () => {
    try {
      setLoadingVideos(true)
      const res = await fetch(`${API_BASE}/api/videos`)
      const data = await res.json()
      setVideos(data)
      const p = await fetch(`${API_BASE}/api/progress/${userId}`)
      const progressData = await p.json()
      const map = {}
      progressData.forEach(it => { map[it.video_id] = it.percent })
      setProgressMap(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingVideos(false)
    }
  }

  const loadPosts = async () => {
    try {
      setLoadingPosts(true)
      const res = await fetch(`${API_BASE}/api/forum/posts`)
      const data = await res.json()
      setPosts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPosts(false)
    }
  }

  useEffect(() => {
    loadVideos()
    loadPosts()
  }, [])

  const ensureSeed = async () => {
    if (videos.length > 0) return
    setCreatingSeed(true)
    const seed = [
      { title: 'Siu Nim Tao – Principes de base', description: 'La première forme du Wing Chun, structure et relaxation', url: 'https://example.com/siu-nim-tao', duration_sec: 780, level: 'beginner', topics: ['formes', 'structure'], requires_plan: 'BASIC' },
      { title: 'Chum Kiu – Mouvement du corps', description: 'Transitions et pivots', url: 'https://example.com/chum-kiu', duration_sec: 820, level: 'intermediate', topics: ['formes', 'mobilité'], requires_plan: 'PREMIUM' },
      { title: 'Chi Sao avancé', description: 'Sensibilité, timing, et applications', url: 'https://example.com/chi-sao', duration_sec: 900, level: 'advanced', topics: ['applications', 'chi sao'], requires_plan: 'VIP' },
    ]
    for (const s of seed) {
      await fetch(`${API_BASE}/api/videos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
    }
    await loadVideos()
    setCreatingSeed(false)
  }

  const markWatched = async (v) => {
    try {
      await fetch(`${API_BASE}/api/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, video_id: v.id || v._id, percent: 100, last_position_sec: v.duration_sec || 0 }) })
      await loadVideos()
    } catch (e) { console.error(e) }
  }

  const createPost = async ({ title, content, topics }) => {
    try {
      setCreatingPost(true)
      await fetch(`${API_BASE}/api/forum/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, title, content, topics }) })
      await loadPosts()
    } catch (e) { console.error(e) } finally { setCreatingPost(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-indigo-600" />
            <div>
              <h1 className="text-lg font-bold">Wing Chun Revolution</h1>
              <p className="text-xs text-gray-500">Apprends. Progresse. Partage.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Basique</Badge>
            <span className="text-xs text-gray-500">Utilisateur: {userId}</span>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <Nav active={active} onChange={setActive} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {active === 'videos' && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold">Bibliothèque vidéo</h2>
                <p className="text-sm text-gray-600">Formes, applications, et techniques avancées</p>
              </div>
              <button onClick={ensureSeed} disabled={creatingSeed} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
                {creatingSeed ? 'Création…' : 'Insérer des exemples'}
              </button>
            </div>
            {loadingVideos ? (
              <div className="text-gray-500">Chargement…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map(v => (
                  <div key={v.id || v._id}>
                    <VideoCard v={v} onTrack={markWatched} />
                    {progressMap[v.id || v._id] ? (
                      <div className="mt-2 text-xs text-green-700">Complété à {progressMap[v.id || v._id]}%</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {active === 'forum' && (
          <section className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Forum communautaire</h2>
                <button onClick={loadPosts} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50">Actualiser</button>
              </div>
              {loadingPosts ? (
                <div className="text-gray-500">Chargement…</div>
              ) : posts.length === 0 ? (
                <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">Aucun post encore. Lance la conversation à droite !</div>
              ) : (
                <div className="space-y-3">
                  {posts.map(p => <ForumPostCard key={p.id || p._id} post={p} />)}
                </div>
              )}
            </div>
            <div>
              <CreatePostForm onCreate={createPost} loading={creatingPost} />
              <div className="mt-4 rounded-xl border bg-white p-4 text-xs text-gray-600">
                <div className="font-medium mb-1">Règles</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Reste courtois et constructif</li>
                  <li>Partage des conseils actionnables</li>
                  <li>Aucune publicité non sollicitée</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {active === 'progress' && (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-6">
              <h3 className="font-semibold mb-1">Résumé</h3>
              <div className="text-sm text-gray-600">Vidéos complétées: <span className="font-semibold text-gray-900">{watchedCount}</span></div>
            </div>
            <div className="rounded-xl border bg-white p-6">
              <h3 className="font-semibold mb-2">Détails</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                {videos.map(v => (
                  <li key={`p-${v.id || v._id}`} className="flex items-center justify-between">
                    <span>{v.title}</span>
                    <Badge color={progressMap[v.id || v._id] >= 100 ? 'green' : 'gray'}>
                      {progressMap[v.id || v._id] ? `${progressMap[v.id || v._id]}%` : '0%'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-500">© {new Date().getFullYear()} Wing Chun Revolution · Plateforme d'apprentissage du Wing Chun</div>
      </footer>
    </div>
  )
}

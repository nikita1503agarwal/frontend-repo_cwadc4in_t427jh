import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Badge({ children, color = 'indigo' }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-${color}-50 px-3 py-1 text-xs font-medium text-${color}-700 ring-1 ring-inset ring-${color}-600/20`}>
      {children}
    </span>
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
      <button onClick={() => onTrack(v)} className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
        Marquer comme regardé
      </button>
    </div>
  )
}

export default function App() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId] = useState('demo-user-1')
  const [progress, setProgress] = useState({})
  const [creating, setCreating] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/videos`)
      const data = await res.json()
      setVideos(data)
      const p = await fetch(`${API_BASE}/api/progress/${userId}`)
      const progressData = await p.json()
      const map = {}
      progressData.forEach(it => { map[it.video_id] = it.percent })
      setProgress(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const ensureSeed = async () => {
    if (videos.length > 0) return
    setCreating(true)
    const seed = [
      { title: 'Siu Nim Tao – Principes de base', description: 'La première forme du Wing Chun, structure et relaxation', url: 'https://example.com/siu-nim-tao', duration_sec: 780, level: 'beginner', topics: ['formes', 'structure'], requires_plan: 'BASIC' },
      { title: 'Chum Kiu – Mouvement du corps', description: 'Transitions et pivots', url: 'https://example.com/chum-kiu', duration_sec: 820, level: 'intermediate', topics: ['formes', 'mobilité'], requires_plan: 'PREMIUM' },
      { title: 'Chi Sao avancé', description: 'Sensibilité, timing, et applications', url: 'https://example.com/chi-sao', duration_sec: 900, level: 'advanced', topics: ['applications', 'chi sao'], requires_plan: 'VIP' },
    ]
    for (const s of seed) {
      await fetch(`${API_BASE}/api/videos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
    }
    await load()
    setCreating(false)
  }

  const markWatched = async (v) => {
    try {
      await fetch(`${API_BASE}/api/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, video_id: v.id || v._id, percent: 100, last_position_sec: v.duration_sec || 0 }) })
      await load()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-indigo-600" />
            <div>
              <h1 className="text-lg font-bold">Wing Chun Revolution</h1>
              <p className="text-xs text-gray-500">Plateforme d'apprentissage – Bibliothèque, progression, communauté</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Basique</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-xl font-semibold">Bibliothèque vidéo</h2>
              <p className="text-sm text-gray-600">150+ vidéos couvrant formes, applications, et techniques avancées</p>
            </div>
            <button onClick={ensureSeed} disabled={creating} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
              {creating ? 'Création…' : 'Insérer des exemples'}
            </button>
          </div>
          {loading ? (
            <div className="text-gray-500">Chargement…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(v => (
                <div key={v.id || v._id}>
                  <VideoCard v={v} onTrack={markWatched} />
                  {progress[v.id || v._id] ? (
                    <div className="mt-2 text-xs text-green-700">Complété à {progress[v.id || v._id]}%</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-3">Forum communautaire</h2>
          <p className="text-sm text-gray-600">Partagez vos questions et progrès avec la communauté.</p>
          <p className="mt-2 text-xs text-gray-500">(Interface de forum à venir — endpoints prêts côté serveur.)</p>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-500">© {new Date().getFullYear()} Wing Chun Revolution</div>
      </footer>
    </div>
  )
}

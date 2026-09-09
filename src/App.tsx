import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import gsap from 'gsap'
import { artifacts, type Language } from './data/artifacts'
import StoryPaper from './components/StoryPaper'
import LoadingScreen from './components/LoadingScreen'
import { assetUrl } from './utils/assets'
import './App.css'
const Scene = lazy(() => import('./components/Scene'))

export default function App() {
  const [active, setActive] = useState<number | null>(null)
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('fragments-language') === 'ar' ? 'ar' : 'en')
  const [sound, setSound] = useState(false), [audioAvailable, setAudioAvailable] = useState(false), [reduced, setReduced] = useState(false)
  const paper = useRef<HTMLDivElement>(null), hero = useRef<HTMLDivElement>(null), explore = useRef<HTMLButtonElement>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    const q = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(q.matches)
    update(); q.addEventListener('change', update)
    fetch(assetUrl('audio/ambient.mp3'), { method: 'HEAD' }).then(r => setAudioAvailable(r.ok && !!r.headers.get('content-type')?.startsWith('audio/'))).catch(() => { })
    return () => { q.removeEventListener('change', update); audio.current?.pause() }
  }, [])
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('fragments-language', language)
  }, [language])
  const select = useCallback((n: number | null) => {
    if (n === active) return
    const change = () => { setActive(n); document.body.style.cursor = ''; if (n === null) requestAnimationFrame(() => explore.current?.focus()) }
    if (paper.current && !reduced) {
      gsap.killTweensOf(paper.current)
      gsap.to(paper.current, { autoAlpha: 0, y: 22, rotation: .5, duration: .22, ease: 'power2.in', onComplete: change })
    } else change()
  }, [active, reduced])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null)
      if (e.key === 'ArrowRight') { e.preventDefault(); select(active === null ? 0 : (active + 1) % 5) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(active === null ? 4 : (active + 4) % 5) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, select])
  useEffect(() => {
    if (active !== null || !hero.current) return
    const tween = gsap.fromTo(hero.current, { autoAlpha: 0, y: reduced ? 0 : 15 }, { autoAlpha: 1, y: 0, duration: reduced ? .15 : 1.05, delay: reduced ? 0 : .15, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [active, reduced])
  async function toggleSound() {
    if (!audioAvailable) return
    if (!audio.current) { audio.current = new Audio(assetUrl('audio/ambient.mp3')); audio.current.loop = true; audio.current.volume = .25 }
    if (sound) { audio.current.pause(); setSound(false) } else { try { await audio.current.play(); setSound(true) } catch { setSound(false) } }
  }
  const arabic = language === 'ar'
  const ui = arabic ? { wordmark: 'شظايا من فلسطين', intro: 'اكتشف فلسطين من خلال الأشياء التي نحملها.', explore: 'استكشف الحكاية', close: 'إغلاق', language: 'English', sound: sound ? 'الصوت مفعّل' : 'الصوت', navigation: 'اختر قطعة', return: 'شظايا من فلسطين — العودة إلى المجموعة' } : { wordmark: 'FRAGMENTS', intro: 'Discover Palestine through the things we carry.', explore: 'Explore the collection', close: 'CLOSE', language: 'العربية', sound: sound ? 'SOUND ON' : 'SOUND', navigation: 'Choose an artifact', return: 'Fragments of Palestine — return to collection' }
  return <main className={`experience${active !== null ? ' is-story' : ''}${arabic ? ' is-arabic' : ''}`} style={{ '--archive-paper': `url(${assetUrl('textures/archive-paper.png')})` } as CSSProperties}>
    <LoadingScreen language={language} />
    <div className="scene-wrap" aria-label={active === null ? (arabic ? 'خمسة أشياء فلسطينية مجتمعة في مشهد ثلاثي الأبعاد' : 'Five Palestinian objects gathered in a warmly lit 3D still life') : (arabic ? `المعروض الآن: ${artifacts[active].ar.title}` : `Only ${artifacts[active].title} is on display. Move your pointer or drag to turn it.`)}>
      <Suspense fallback={<div className="canvas-loading">Gathering the fragments…</div>}><Scene active={active} onSelect={select} reduced={reduced} /></Suspense>
    </div>
    <header>
      <a className="wordmark" href="#" onClick={e => { e.preventDefault(); select(null) }} aria-label={ui.return}><span className="brand-symbol">❋</span><span>{ui.wordmark}<small>{arabic ? 'ذاكرة / أرض / شعب' : 'OF PALESTINE'}</small></span></a>
      <div className="header-actions"><button className="language-toggle" onClick={() => setLanguage(arabic ? 'en' : 'ar')} aria-label={arabic ? 'Switch to English' : 'التبديل إلى العربية'}>{ui.language}</button>{active !== null ? <button className="close-story" onClick={() => select(null)}>{ui.close} <span>×</span></button> : null}</div>
    </header>
    {active === null ? <section className="hero-copy" ref={hero} aria-labelledby="hero-title">
      <p className="eyebrow">LAND / PEOPLE / MEMORY / STILL HERE</p><h1 id="hero-title">{arabic ? <>خمسة أشياء.<br /><em>حكاية واحدة.</em></> : <>Five objects.<br /><em>One story.</em></>}</h1>
      <p className="intro">{ui.intro}</p>
      <button ref={explore} className="explore" onClick={() => select(0)}>{ui.explore} <span>↗</span></button>
    </section> : <StoryPaper key={`${active}-${language}`} index={active} language={language} reduced={reduced} shellRef={paper} onSelect={select} />}
    <nav className="collection-nav" aria-label={ui.navigation}>
      {artifacts.map((a, i) => <button key={a.id} className={active === i ? 'active' : ''} onClick={() => select(i)} aria-label={arabic ? `فتح ${a.ar.title}` : `Open ${a.title}`} aria-current={active === i ? 'step' : undefined}><span className="nav-name">{arabic ? a.ar.title : a.title.replace('The ', '')}</span></button>)}
    </nav>
    <footer>{audioAvailable && <button className="sound" onClick={toggleSound} aria-pressed={sound} title={audioAvailable ? 'Toggle ambient sound' : 'Ambient audio has not been added'} aria-label={audioAvailable ? 'Toggle ambient sound' : 'Ambient sound unavailable'}>{ui.sound} <span>{sound ? '◖))' : '○'}</span></button>}</footer>
  </main>
}


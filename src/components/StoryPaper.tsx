import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'
import { artifacts, type Language } from '../data/artifacts'

type Props = {
  index: number
  language: Language
  reduced: boolean
  shellRef: RefObject<HTMLDivElement | null>
  onSelect: (n: number | null) => void
}
export default function StoryPaper({ index, language, reduced, shellRef, onSelect }: Props) {
  const heading = useRef<HTMLHeadingElement>(null), artifact = artifacts[index], story = language === 'ar' ? artifact.ar : artifact
  const reading = useRef<HTMLDivElement>(null), [more, setMore] = useState(false)
  useEffect(() => {
    const el = reading.current!
    const update = () => setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 12)
    const observer = new ResizeObserver(update); observer.observe(el)
    el.addEventListener('scroll', update, { passive: true })
    return () => { observer.disconnect(); el.removeEventListener('scroll', update) }
  }, [index])
  useLayoutEffect(() => {
    const tween = gsap.fromTo(shellRef.current,
      { autoAlpha: 0, y: reduced ? 0 : 95, rotateX: reduced ? 0 : -12, rotation: reduced ? 0 : -4, scale: reduced ? 1 : .94 },
      { autoAlpha: 1, y: 0, rotateX: 0, rotation: reduced ? 0 : -1.15, scale: 1, delay: reduced ? 0 : .32, duration: reduced ? .15 : 1.25, ease: 'power3.out', onComplete: () => heading.current?.focus({ preventScroll: true }) })
    return () => { tween.kill() }
  }, [index, reduced, shellRef])
  const arabic = language === 'ar'
  return <div className={`paper-shell${arabic ? ' is-arabic-paper' : ''}`} ref={shellRef}>
    <article className="paper-document" aria-labelledby="story-title">
      <div className="paper-reading" ref={reading} key={`${index}-${language}`} tabIndex={0} aria-label={arabic ? 'مرّر لقراءة الحكاية' : 'Scroll the story'}>
        <h2 id="story-title" ref={heading} tabIndex={-1}>{story.title}</h2>
        <p className="paper-subtitle">{story.subtitle}</p>
        <div className="paper-rule" />
        <div className="story-body">{story.body.map(p => <p key={p}>{p}</p>)}</div>
        <blockquote>{story.quote}</blockquote>
        <p className="paper-keywords">{story.keywords}</p>
      </div>
      <div className="paper-footer"><span>{more ? (arabic ? 'تابع القراءة ↓' : 'Continue reading ↓') : (arabic ? 'نهاية الحكاية' : 'End of story')}</span><span>{String(index + 1).padStart(2, '0')} / 05</span></div>
    </article>
    <div className="paper-controls"><button onClick={() => onSelect((index + 4) % 5)}>{arabic ? 'السابق ←' : '← PREVIOUS'}</button><button onClick={() => onSelect((index + 1) % 5)}>{arabic ? 'التالي →' : 'NEXT →'}</button></div>
  </div>
}

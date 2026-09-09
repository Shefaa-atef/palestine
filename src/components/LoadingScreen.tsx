import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import type { Language } from '../data/artifacts'

const MINIMUM_DISPLAY_MS = 900

export default function LoadingScreen({ language }: { language: Language }) {
    const { active, progress } = useProgress()
    const [minimumElapsed, setMinimumElapsed] = useState(false)
    const started = useRef(false)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (active || progress > 0) started.current = true
    }, [active, progress])

    useEffect(() => {
        const timer = window.setTimeout(() => setMinimumElapsed(true), MINIMUM_DISPLAY_MS)
        return () => window.clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!minimumElapsed || active || !started.current) return
        const timer = window.setTimeout(() => setVisible(false), 320)
        return () => window.clearTimeout(timer)
    }, [active, minimumElapsed, started])

    if (!visible) return null

    const percentage = Math.min(100, Math.round(progress)), arabic = language === 'ar'
    return <div className={`loading-page${minimumElapsed && !active ? ' is-finishing' : ''}`} role="status" aria-live="polite" aria-label={`Loading the collection, ${percentage}% complete`}>
        <div className="loading-mark" aria-hidden="true">❋</div>
        <p className="loading-title">{arabic ? 'شظايا من فلسطين' : 'Fragments of Palestine'}</p>
        <p className="loading-subtitle">{arabic ? 'خمسة أشياء. حكاية واحدة.' : 'Five objects. One story.'}</p>
        <div className="loading-meter" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
        <div className="loading-meta"><span>{arabic ? 'نُحضّر المجموعة' : 'Preparing the collection'}</span><span>{String(percentage).padStart(2, '0')} — 100%</span></div>
    </div>
}
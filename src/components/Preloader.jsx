import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { profile } from '../content'

const BOOT = [
  { id: 'renderer', text: 'INIT RENDERER' },
  { id: 'fonts', text: 'LOAD FONTS' },
  { id: 'fantasy', text: 'COMPILE FANTASY' },
]

const pad = (n) => String(n).padStart(2, '0')

export default function Preloader({ onReveal, onDone }) {
  const root = useRef(null)
  const bar = useRef(null)
  const tc = useRef(null)
  const doneRef = useRef(new Set())
  const exitTimer = useRef(0)
  const [done, setDone] = useState({})

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      onReveal?.()
      const t = setTimeout(() => onDone?.(), 100)
      return () => clearTimeout(t)
    }

    let exited = false
    const start = performance.now()

    /* 24fps 时间码 */
    const tick = () => {
      if (!tc.current) return
      const e = (performance.now() - start) / 1000
      tc.current.textContent = `TC 00:00:${pad(Math.floor(e) % 60)}:${pad(Math.floor(e * 24) % 24)}`
    }
    gsap.ticker.add(tick)

    gsap.set(bar.current, { scaleX: 0.05 })
    const progress = gsap.quickTo(bar.current, 'scaleX', { duration: 0.5, ease: 'power3.out' })
    progress(0.18)

    /* 引片入场：启动日志 → 片头字幕（tracking 收拢）→ 分隔线 → 副标题 */
    const ctx = gsap.context(() => {
      gsap.set('.preloader__brand .mask span', { y: 0 })
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .fromTo(
          '.preloader__log-line',
          { opacity: 0, x: -14 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.26 },
          1.0
        )
        .fromTo('.preloader__overline', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55 }, 0.95)
        .fromTo(
          '.preloader__brand .mask span',
          { yPercent: 118 },
          { yPercent: 0, duration: 0.95, stagger: 0.05 },
          1.05
        )
        .fromTo('.preloader__brand', { letterSpacing: '0.3em' }, { letterSpacing: '0.04em', duration: 1.15 }, 1.05)
        .fromTo('.preloader__rule', { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, 1.5)
        .fromTo('.preloader__tag', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 1.7)
    }, root)

    /* 退场：闪帧 → 字卡前推溶解 → 打板信息淡出 → 揭示正片 */
    const exit = () => {
      if (exited) return
      exited = true
      gsap.ticker.remove(tick)
      progress(1)
      gsap
        .timeline({ onComplete: () => onDone?.() })
        .to('.preloader__flash', { opacity: 0.12, duration: 0.09, ease: 'none' }, 0.05)
        .to('.preloader__flash', { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0.15)
        .to('.preloader__stage', { opacity: 0, scale: 1.04, filter: 'blur(8px)', duration: 0.45, ease: 'power2.in' }, 0.08)
        .to(
          ['.preloader__slate', '.preloader__log', '.preloader__tc'],
          { opacity: 0, duration: 0.35, ease: 'power2.out' },
          0.18
        )
        .call(() => onReveal?.(), null, 0.5)
        .to(root.current, { opacity: 0, duration: 0.75, ease: 'power2.out' }, 0.4)
    }

    /* 真实加载状态：渲染器 / 字体 / 最短观影时长 */
    const markDone = (id) => {
      if (doneRef.current.has(id) || exited) return
      doneRef.current.add(id)
      setDone((prev) => ({ ...prev, [id]: true }))
      progress(0.18 + (doneRef.current.size / BOOT.length) * 0.74)
      if (doneRef.current.size === BOOT.length) {
        exitTimer.current = setTimeout(exit, 180)
      }
    }

    const onScene = () => markDone('renderer')
    if (window.__stardustSceneReady) markDone('renderer')
    else window.addEventListener('stardust:scene-ready', onScene, { once: true })

    document.fonts?.ready.then(() => markDone('fonts'))

    const minTimer = setTimeout(() => markDone('fantasy'), 2300)
    const capTimer = setTimeout(() => BOOT.forEach((b) => markDone(b.id)), 3400)

    return () => {
      exited = true
      gsap.ticker.remove(tick)
      clearTimeout(minTimer)
      clearTimeout(capTimer)
      clearTimeout(exitTimer.current)
      window.removeEventListener('stardust:scene-ready', onScene)
      ctx.revert()
    }
  }, [onReveal, onDone])

  return (
    <div className="preloader" ref={root}>
      <div className="preloader__grain" aria-hidden="true" />
      <div className="preloader__slate">
        <span>RUYUE — PORTFOLIO</span>
        <span>SCENE 01 · TAKE 01</span>
      </div>
      <div className="preloader__stage">
        <div className="preloader__stage-inner">
          <div className="preloader__overline">A 2026 PRODUCTION</div>
          <div className="preloader__brand">
            {profile.name.split('').map((char, index) => (
              <span className="mask" key={index}>
                <span>{char}</span>
              </span>
            ))}
          </div>
          <div className="preloader__rule" />
          <div className="preloader__tag">{profile.tagline}</div>
        </div>
      </div>
      <div className="preloader__log">
        {BOOT.map((line) => (
          <div className="preloader__log-line" key={line.id}>
            <span>&gt; {line.text}</span>
            <span className="preloader__log-dots" aria-hidden="true" />
            <span className={`preloader__log-status${done[line.id] ? ' is-ok' : ''}`}>{done[line.id] ? 'OK' : '···'}</span>
          </div>
        ))}
      </div>
      <div className="preloader__tc" ref={tc}>
        TC 00:00:00:00
      </div>
      <div className="preloader__bar">
        <span ref={bar} />
      </div>
      <div className="preloader__flash" aria-hidden="true" />
    </div>
  )
}

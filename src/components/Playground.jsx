import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { quotes, arcade, achievements } from '../content'
import useReveal from '../hooks/useReveal'
import { useTiltGroup } from '../hooks/useTilt'
import { IS_MAC } from '../lib/env'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

const GLYPHS = '零壹星辰代码宇宙梦信号噪声光年熵'
const PALETTE = ['#6ee7ff', '#e9f6ff', '#7dd3fc', '#38bdf8', '#a5f3fc']
const STORE_KEY = 'stardust:achievements'
const VISITS_KEY = 'stardust:visits'
const SOUND_KEY = 'stardust:bg-sound'
const BG_VIDEO = arcade.bg?.src || null

function loadUnlocked() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]')
    return new Set(Array.isArray(raw) ? raw : [])
  } catch {
    return new Set()
  }
}

export default function Playground() {
  const root = useReveal({ selector: '.reveal', start: 'top 82%' })
  useTiltGroup(root, '.btn', { max: 13, scale: 1.08 })
  useTiltGroup(root, '.badge', { max: 9, scale: 1.05 })
  useTiltGroup(root, '.playground__quote-wrap', {
    max: 4.5,
    scale: 1.015,
    inner: '.playground__quote',
    innerScale: 1.03,
    innerShift: 5,
  })
  const fx = useRef(null)
  const quoteEl = useRef(null)
  const progress = useRef(0)
  const lastQuote = useRef(quotes[0])
  const glyphTimer = useRef(null)
  const toastTimer = useRef(null)
  const comboRef = useRef(false)
  const [toast, setToast] = useState(null)
  const [speaker, setSpeaker] = useState(arcade.speakers[0])
  const [unlocked, setUnlocked] = useState(loadUnlocked)
  const unlockedRef = useRef(unlocked)
  const videoRef = useRef(null)
  const inViewRef = useRef(false)
  const activatedRef = useRef(false)
  const soundRef = useRef(true)
  const [videoOk, setVideoOk] = useState(Boolean(BG_VIDEO))
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return window.localStorage.getItem(SOUND_KEY) !== 'off'
    } catch {
      return true
    }
  })
  const [playingSound, setPlayingSound] = useState(false)
  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  const showVideo = Boolean(BG_VIDEO) && videoOk && !reduceMotion

  /* 背景视频声音：浏览器要求有声播放前存在用户交互，
     因此先静音自动播放，首次交互后自动尝试开声，失败则保持静音等手动开启 */
  const applySound = useCallback(async () => {
    const video = videoRef.current
    if (!video || !inViewRef.current) return
    if (soundRef.current && activatedRef.current) {
      video.muted = false
      video.volume = 0.55
      try {
        await video.play()
        setPlayingSound(true)
        return
      } catch {
        video.muted = true
      }
    }
    video.muted = true
    video.play?.()?.catch?.(() => {})
    setPlayingSound(false)
  }, [])

  useEffect(() => {
    soundRef.current = soundOn
    try {
      window.localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off')
    } catch {
      /* ignore */
    }
    applySound()
  }, [soundOn, applySound])

  useEffect(() => {
    const activate = () => {
      if (activatedRef.current) return
      activatedRef.current = true
      applySound()
    }
    window.addEventListener('pointerdown', activate, { passive: true })
    window.addEventListener('keydown', activate)
    return () => {
      window.removeEventListener('pointerdown', activate)
      window.removeEventListener('keydown', activate)
    }
  }, [applySound])

  /* 背景视频：进入视口播放（含声音策略），离屏暂停 */
  useEffect(() => {
    const video = videoRef.current
    if (!video || !showVideo) return undefined
    video.muted = true
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting
        if (entry.isIntersecting) {
          applySound()
        } else {
          video.pause()
          setPlayingSound(false)
        }
      },
      { threshold: 0.2 }
    )
    io.observe(video)
    return () => io.disconnect()
  }, [showVideo, applySound])

  const showToast = useCallback((text) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const burst = useCallback((x, y, count = 18, spread = 130) => {
    const layer = fx.current
    if (!layer) return
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span')
      dot.className = 'fx-dot'
      dot.style.left = `${x}px`
      dot.style.top = `${y}px`
      dot.style.background = PALETTE[i % PALETTE.length]
      const size = 6 + Math.random() * 8
      dot.style.width = `${size}px`
      dot.style.height = `${size}px`
      layer.appendChild(dot)
      gsap.set(dot, { xPercent: -50, yPercent: -50 })
      const angle = Math.random() * Math.PI * 2
      const dist = 50 + Math.random() * spread
      gsap.to(dot, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        scale: 0,
        opacity: 0,
        duration: 0.9 + Math.random() * 0.8,
        ease: 'power3.out',
        onComplete: () => dot.remove(),
      })
    }
  }, [])

  const unlock = useCallback(
    (id) => {
      if (unlockedRef.current.has(id)) return
      unlockedRef.current.add(id)
      setUnlocked(new Set(unlockedRef.current))
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify([...unlockedRef.current]))
      } catch {
        /* 隐私模式下忽略 */
      }
      const def = achievements.find((a) => a.id === id)
      if (def) showToast(`ACHIEVEMENT UNLOCKED · ${def.name}`)
    },
    [showToast]
  )

  const activate = useCallback(() => {
    const body = document.body
    body.classList.toggle('konami')
    const on = body.classList.contains('konami')
    showToast(on ? 'KONAMI CODE ACCEPTED · 黄金模式已开启' : 'KONAMI CODE RESET · 回到冷静模式')
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    burst(cx, cy, 64, 460)
    window.setTimeout(() => burst(cx, cy, 40, 340), 200)
    unlock('easter')
  }, [burst, showToast, unlock])

  const scrambleEl = useCallback((el, text) => {
    if (!el) return
    window.clearInterval(glyphTimer.current)
    let frame = 0
    const total = 26
    glyphTimer.current = window.setInterval(() => {
      frame += 1
      const p = frame / total
      el.textContent = text
        .split('')
        .map((char, index) => (index / text.length < p ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join('')
      if (frame >= total) {
        window.clearInterval(glyphTimer.current)
        el.textContent = text
      }
    }, 32)
  }, [])

  const pickQuote = useCallback(() => {
    let next = quotes[Math.floor(Math.random() * quotes.length)]
    if (next === lastQuote.current) next = quotes[(quotes.indexOf(next) + 1) % quotes.length]
    lastQuote.current = next
    return next
  }, [])

  const doQuote = useCallback(() => {
    scrambleEl(quoteEl.current, pickQuote())
    setSpeaker((prev) => {
      const pool = arcade.speakers.filter((s) => s !== prev)
      return pool[Math.floor(Math.random() * pool.length)]
    })
    unlock('philosopher')
  }, [scrambleEl, pickQuote, unlock])

  const doFireworks = useCallback(
    (x, y, count = 30, spread = 240) => {
      burst(x, y, count, spread)
      unlock('fireworks')
    },
    [burst, unlock]
  )

  const randomX = () => window.innerWidth * (0.3 + Math.random() * 0.4)
  const randomY = () => window.innerHeight * (0.28 + Math.random() * 0.35)

  /* 键位 F / Q + 秘技 Konami */
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (document.querySelector('.palette')) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === 'f') {
        doFireworks(randomX(), randomY())
        return
      }
      if (key === 'q') {
        doQuote()
        return
      }
      if (key === KONAMI[progress.current]) {
        progress.current += 1
        if (progress.current === KONAMI.length) {
          progress.current = 0
          activate()
        }
      } else {
        progress.current = key === KONAMI[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activate, doFireworks, doQuote])

  /* 命令面板与远程动作 */
  useEffect(() => {
    const onFireworks = () => doFireworks(randomX(), randomY(), 34, 260)
    const onInspiration = () => doQuote()
    const onGold = () => activate()
    const onPalette = () => unlock('operator')
    window.addEventListener('stardust:fireworks', onFireworks)
    window.addEventListener('stardust:inspiration', onInspiration)
    window.addEventListener('stardust:gold', onGold)
    window.addEventListener('stardust:palette-open', onPalette)
    return () => {
      window.removeEventListener('stardust:fireworks', onFireworks)
      window.removeEventListener('stardust:inspiration', onInspiration)
      window.removeEventListener('stardust:gold', onGold)
      window.removeEventListener('stardust:palette-open', onPalette)
    }
  }, [doFireworks, doQuote, activate, unlock])

  /* 回访计数 → 二周目 */
  useEffect(() => {
    try {
      const n = Number(window.localStorage.getItem(VISITS_KEY) || 0) + 1
      window.localStorage.setItem(VISITS_KEY, String(n))
      if (n >= 2) unlock('regular')
    } catch {
      /* ignore */
    }
  }, [unlock])

  /* 全成就彩蛋 */
  useEffect(() => {
    if (comboRef.current || unlocked.size < achievements.length) return
    comboRef.current = true
    showToast('FULL COMBO · 全成就达成，尾行奖励已发放')
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const t1 = window.setTimeout(() => burst(cx, cy, 90, 540), 300)
    const t2 = window.setTimeout(() => burst(cx, cy, 50, 360), 650)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [unlocked, burst, showToast])

  useEffect(
    () => () => {
      window.clearInterval(glyphTimer.current)
      window.clearTimeout(toastTimer.current)
    },
    []
  )

  const onBadgeEnter = (e, def) => {
    if (!unlocked.has(def.id) || def.fx !== 'fx-scramble') return
    const el = e.currentTarget.querySelector('.badge__name')
    if (el) scrambleEl(el, def.name)
  }

  return (
    <section className="section playground" id="playground" ref={root}>
      <div className="playground__bg" aria-hidden="true">
        {showVideo && (
          <video
            ref={videoRef}
            className="playground__bg-video"
            src={BG_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            onError={() => setVideoOk(false)}
          />
        )}
      </div>
      {showVideo && (
        <button
          type="button"
          className={`bg-sound${playingSound ? ' is-on' : ''}`}
          onClick={() => setSoundOn((v) => !v)}
          data-cursor
          aria-label={playingSound ? '关闭背景声音' : '开启背景声音'}
        >
          <span className="bg-sound__eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {playingSound ? 'SOUND ON' : 'SOUND OFF'}
        </button>
      )}
      <div className="container">
        <div className="section__head reveal">
          <span className="section__label">03 / ARCADE</span>
          <span className="section__line" />
        </div>
        <div className="playground__panel">
          <div className="reveal">
            <div className="playground__attract">PRESS START</div>
            <h2 className="section__title">玩家一号</h2>
            <div className="playground__actions">
              <button
                className="btn"
                onClick={(e) => {
                  doFireworks(e.clientX, e.clientY, 22, 150)
                  if (unlockedRef.current.has('fireworks')) showToast('烟花进程已退出，退出码 0')
                }}
                data-cursor
              >
                <kbd>F</kbd> 执行烟花
              </button>
              <button
                className="btn"
                onClick={(e) => {
                  doQuote()
                  const rect = e.currentTarget.getBoundingClientRect()
                  burst(rect.left + rect.width / 2, rect.top, 10, 60)
                }}
                data-cursor
              >
                <kbd>Q</kbd> 随机灵感
              </button>
            </div>
            <p className="playground__hint">
              或输入秘技 <kbd>↑</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>{' '}
              <kbd>←</kbd> <kbd>→</kbd> <kbd>B</kbd> <kbd>A</kbd>
              <br />
              <kbd>{IS_MAC ? '⌘ K' : 'Ctrl K'}</kbd> 命令面板 · 集齐全部成就有惊喜
            </p>
          </div>
          <div className="playground__quote-wrap reveal">
            <div className="playground__speaker">{speaker}</div>
            <p className="playground__quote" ref={quoteEl}>
              {quotes[0]}
            </p>
          </div>
        </div>
        <div className="arcade__meta reveal">
          <div className="arcade__xp">
            <span>XP</span>
            <div className="arcade__xp-bar">
              <span style={{ transform: `scaleX(${unlocked.size / achievements.length})` }} />
            </div>
            <span>
              {unlocked.size}/{achievements.length}
            </span>
          </div>
          <div className="badges">
            {achievements.map((def) => {
              const on = unlocked.has(def.id)
              return (
                <div key={def.id} className={`badge ${on ? 'is-on' : ''} ${def.fx}`} onMouseEnter={(e) => onBadgeEnter(e, def)} data-cursor>
                  <span className="badge__name">{on ? def.name : '???'}</span>
                  <span className="badge__hint">{on ? 'UNLOCKED' : def.hint}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="fx-layer" ref={fx} aria-hidden="true" />
      {toast && <div className="toast">{toast}</div>}
    </section>
  )
}

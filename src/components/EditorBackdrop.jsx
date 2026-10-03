import { useEffect, useMemo, useRef, useState } from 'react'

/* 背景里滚动展示的正是本站 Works 组件自己的源码 */
const CODE = `// stardust — src/components/Works.jsx
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { works } from '../content'
import WorkCover from './WorkCover'

// 滚动条就是摄影机轨道
const CAMERA = { scrub: 1, pin: true, anticipatePin: 1 }

export default function Works() {
  const track = useRef(null)

  useEffect(() => {
    const distance = () => track.current.scrollWidth - window.innerWidth
    gsap.to(track.current, {
      x: () => -distance(),
      scrollTrigger: { trigger: '#works', ...CAMERA },
    })
  }, [])

  return (
    <section className="works" id="works">
      {works.map((work, index) => (
        <WorkCard key={work.en} work={work} index={index} />
      ))}
    </section>
  )
}

function WorkCard({ work, index }) {
  return (
    <article className="work" data-cursor>
      <WorkCover sketch={work.sketch} />
      <span className="work__index">{String(index + 1).padStart(2, '0')}</span>
    </article>
  )
}

// ideas keep compiling...`

const KEYWORDS = new Set([
  'import',
  'export',
  'from',
  'const',
  'let',
  'var',
  'function',
  'return',
  'default',
  'new',
  'if',
  'else',
])

const TOKEN_RE = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g

function tokenize(line) {
  const tokens = []
  let m
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(line))) {
    if (m[1]) tokens.push({ c: 'com', t: m[1] })
    else if (m[2]) tokens.push({ c: 'str', t: m[2] })
    else if (m[3]) tokens.push({ c: 'num', t: m[3] })
    else if (m[4]) {
      const after = line[m.index + m[0].length]
      const cls = KEYWORDS.has(m[4]) ? 'kw' : after === '(' ? 'fn' : 'id'
      tokens.push({ c: cls, t: m[4] })
    } else tokens.push({ c: 'pn', t: m[0] })
  }
  return tokens
}

const CARET_LINE = CODE.split('\n').findIndex((l) => l.includes('CAMERA'))

export default function EditorBackdrop() {
  const scrollRef = useRef(null)
  const firstRef = useRef(null)
  const [copies, setCopies] = useState(2)
  const [drift, setDrift] = useState(null)

  const lines = useMemo(() => CODE.split('\n').map(tokenize), [])

  /* 按容器高度决定代码副本数量，保证无缓滚动无缝循环 */
  useEffect(() => {
    const scroll = scrollRef.current
    const first = firstRef.current
    if (!scroll || !first) return undefined

    const measure = () => {
      const copyH = first.offsetHeight
      if (copyH < 10) return
      const bodyH = scroll.parentElement.offsetHeight
      setCopies(Math.max(2, Math.ceil(bodyH / copyH) + 1))
      setDrift({ dist: copyH, dur: Math.max(30, copyH / 11) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(first)
    ro.observe(scroll.parentElement)
    return () => ro.disconnect()
  }, [])

  /* 离屏暂停滚动 */
  useEffect(() => {
    const scroll = scrollRef.current
    if (!scroll) return undefined
    const io = new IntersectionObserver(([entry]) => {
      scroll.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused'
    })
    io.observe(scroll)
    return () => io.disconnect()
  }, [])

  const renderLines = (innerRef) => (
    <div className="editor__lines" ref={innerRef}>
      {lines.map((tokens, i) => (
        <div className="editor__row" key={i}>
          <span className="editor__ln">{String(i + 1).padStart(2, '0')}</span>
          <span className="editor__code">
            {tokens.map((t, j) => (
              <span key={j} className={`tok tok--${t.c}`}>
                {t.t}
              </span>
            ))}
            {i === CARET_LINE && <span className="editor__caret" aria-hidden="true" />}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="editor" aria-hidden="true">
      <div className="editor__head">
        <span className="editor__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="editor__tab">works.jsx</span>
        <span className="editor__path">stardust — src/components</span>
      </div>
      <div className="editor__body">
        <div
          className="editor__scroll"
          ref={scrollRef}
          style={drift ? { '--drift': `-${drift.dist}px`, '--drift-dur': `${drift.dur}s` } : undefined}
        >
          {Array.from({ length: copies }, (_, i) => renderLines(i === 0 ? firstRef : null))}
        </div>
      </div>
      <div className="editor__status">
        <span>⎇ main*</span>
        <span>JSX</span>
        <span>UTF-8</span>
        <span className="editor__status-right">Ln 12, Col 24 · 滚动即运镜</span>
      </div>
    </div>
  )
}

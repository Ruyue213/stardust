import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { profile, skills, stats } from '../content'
import { useTiltGroup } from '../hooks/useTilt'

export default function About() {
  const root = useRef(null)
  const statement = useRef(null)
  useTiltGroup(root, '.skill', { max: 12, scale: 1.09 })

  useEffect(() => {
    const rootEl = root.current
    const statementEl = statement.current
    if (!rootEl || !statementEl) return

    const text = statementEl.textContent
    statementEl.textContent = ''
    const fragment = document.createDocumentFragment()
    for (const char of text) {
      if (char === '\n') {
        fragment.appendChild(document.createElement('br'))
        continue
      }
      const span = document.createElement('span')
      span.className = 'about__char'
      span.textContent = char
      fragment.appendChild(span)
    }
    statementEl.appendChild(fragment)

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about__char',
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.4,
          scrollTrigger: { trigger: statementEl, start: 'top 80%', end: 'bottom 55%', scrub: true },
        }
      )

      gsap.from('.about__meta span', {
        y: 14,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.09,
        scrollTrigger: { trigger: '.about__meta', start: 'top 90%', once: true },
      })

      gsap.from('.stat', {
        y: 44,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.stats', start: 'top 85%', once: true },
      })

      gsap.from('.skill', {
        y: 26,
        opacity: 0,
        scale: 0.6,
        filter: 'blur(6px)',
        duration: 0.85,
        ease: 'back.out(2.4)',
        stagger: { each: 0.065, from: 'random' },
        scrollTrigger: { trigger: '.skills', start: 'top 88%', once: true },
      })
    }, rootEl)

    return () => ctx.revert()
  }, [])

  return (
    <section className="section about" id="about" ref={root}>
      <div className="container">
        <div className="section__head">
          <span className="section__label">01 / ABOUT</span>
          <span className="section__line" />
        </div>
        <p className="about__statement" ref={statement}>
          {profile.statement}
        </p>
        <div className="about__meta">
          {profile.timeline.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="about__grid">
          <div className="stats">
            {stats.map((item) => (
              <div className="stat" key={item.label}>
                <div className="stat__value stat__value--text">{item.value}</div>
                <div className="stat__label">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="about__side">
            <div className="skills">
              {skills.map((skill) => (
                <span className="skill" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
            <div className="about__badge" aria-hidden="true">
              <svg viewBox="0 0 160 160">
                <defs>
                  <path id="badge-circle" d="M80,80 m-58,0 a58,58 0 1,1 116,0 a58,58 0 1,1 -116,0" />
                </defs>
                <text>
                  <textPath href="#badge-circle">
                    HELLO WORLD · KEEP BUILDING · HELLO WORLD · KEEP BUILDING ·
                  </textPath>
                </text>
              </svg>
              <span className="about__badge-dot" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
